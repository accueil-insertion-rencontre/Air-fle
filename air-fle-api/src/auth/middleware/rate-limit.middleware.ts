import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';
import { ICacheService } from '../interfaces/auth.interface';

interface RateLimitOptions {
  windowMs: number; // Fenêtre de temps en millisecondes
  maxRequests: number; // Nombre maximum de requêtes par fenêtre
  message?: string; // Message d'erreur personnalisé
  skipSuccessfulRequests?: boolean; // Ne compter que les requêtes échouées
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);
  constructor(
    @Inject('ICacheService') private readonly cacheService: ICacheService,
  ) {}

  // Configuration par défaut pour différents endpoints
  private readonly configs: Record<string, RateLimitOptions> = {
    '/auth/login': {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
    },
    '/auth/reset-password/request': {
      windowMs: 60 * 60 * 1000, // 1 heure
      maxRequests: 3,
      message: 'Trop de demandes de réinitialisation. Réessayez dans 1 heure.',
    },
    '/auth/reset-password/confirm': {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      message:
        'Trop de tentatives de réinitialisation. Réessayez dans 15 minutes.',
    },
    default: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      message: 'Trop de requêtes. Réessayez plus tard.',
    },
  };

  async use(req: Request, res: Response, next: NextFunction) {
    const ip = this.getClientIP(req);
    const endpoint = this.getEndpointKey(req);
    const config = this.configs[endpoint] || this.configs.default;

    try {
      const canProceed = await this.checkRateLimit(ip, endpoint, config);

      if (!canProceed) {
        const resetTime = await this.getRemainingTime(ip, endpoint);

        res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', resetTime.toString());

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: config.message,
            error: 'Too Many Requests',
            retryAfter: Math.ceil(resetTime / 1000),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Ajouter les headers informatifs
      const remaining = await this.getRemainingRequests(ip, endpoint, config);
      res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());

      next();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      // En cas d'erreur du cache, laisser passer la requête
      this.logger.error(
        `Erreur rate limiting: ${error?.message}`,
        error?.stack,
      );
      next();
    }
  }

  private async checkRateLimit(
    ip: string,
    endpoint: string,
    config: RateLimitOptions,
  ): Promise<boolean> {
    const key = `rate_limit:${endpoint}:${ip}`;
    const windowStart = Date.now() - config.windowMs;

    // Récupérer les timestamps des requêtes dans la fenêtre
    const requests = await this.cacheService.get(key);
    let timestamps: number[] = requests ? JSON.parse(requests) : [];

    // Filtrer les requêtes dans la fenêtre de temps
    timestamps = timestamps.filter((timestamp) => timestamp > windowStart);

    // Vérifier si on dépasse la limite
    if (timestamps.length >= config.maxRequests) {
      return false;
    }

    // Ajouter la nouvelle requête
    timestamps.push(Date.now());

    // Sauvegarder avec expiration
    await this.cacheService.set(
      key,
      JSON.stringify(timestamps),
      Math.ceil(config.windowMs / 1000),
    );

    return true;
  }

  private async getRemainingRequests(
    ip: string,
    endpoint: string,
    config: RateLimitOptions,
  ): Promise<number> {
    const key = `rate_limit:${endpoint}:${ip}`;
    const windowStart = Date.now() - config.windowMs;

    const requests = await this.cacheService.get(key);
    const timestamps: number[] = requests ? JSON.parse(requests) : [];

    const validRequests = timestamps.filter(
      (timestamp) => timestamp > windowStart,
    );
    return Math.max(0, config.maxRequests - validRequests.length);
  }

  private async getRemainingTime(
    ip: string,
    endpoint: string,
  ): Promise<number> {
    const key = `rate_limit:${endpoint}:${ip}`;
    const requests = await this.cacheService.get(key);

    if (!requests) {
      return 0;
    }

    const timestamps: number[] = JSON.parse(requests);
    if (timestamps.length === 0) {
      return 0;
    }

    const oldestRequest = Math.min(...timestamps);
    const config = this.configs[endpoint] || this.configs.default;

    return Math.max(0, oldestRequest + config.windowMs - Date.now());
  }

  private getClientIP(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string) ||
      (req.headers['x-real-ip'] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    )
      .split(',')[0]
      .trim();
  }

  private getEndpointKey(req: Request): string {
    const method = req.method;
    // Normaliser le chemin pour ignorer les préfixes globaux (ex: /api/v1)
    const normalizedPath = req.path.replace(/^\/api(\/v\d+)?/, '') || '/';

    // Correspondance exacte pour les endpoints sensibles (POST uniquement)
    const sensitiveEndpoints = [
      '/auth/login',
      '/auth/reset-password/request',
      '/auth/reset-password/confirm',
    ];

    if (method === 'POST') {
      for (const endpoint of sensitiveEndpoints) {
        if (normalizedPath === endpoint) {
          return endpoint;
        }
      }
    }

    return 'default';
  }
}
