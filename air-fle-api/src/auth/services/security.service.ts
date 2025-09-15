import { Injectable, Inject, Logger } from '@nestjs/common';
import { ISecurityService, ICacheService } from '../interfaces/auth.interface';
import { SECURITY_CONFIG } from '../config/permissions.config';
import { getErrorMessage, getErrorStack } from '../../common/types/error.types';

@Injectable()
export class SecurityService implements ISecurityService {
  private readonly logger = new Logger(SecurityService.name);
  constructor(
    @Inject('ICacheService') private readonly cacheService: ICacheService,
  ) {}

  async isIPBlocked(ip: string): Promise<boolean> {
    const key = `login_attempts:${ip}`;
    const attempts = await this.cacheService.get(key);

    if (!attempts) {
      return false;
    }

    const attemptCount = parseInt(attempts, 10);
    return attemptCount >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS;
  }

  async incrementLoginAttempt(ip: string): Promise<void> {
    const key = `login_attempts:${ip}`;
    const attempts = await this.cacheService.get(key);

    if (!attempts) {
      // Première tentative
      await this.cacheService.set(key, '1', SECURITY_CONFIG.LOCK_TIME);
    } else {
      const attemptCount = parseInt(attempts, 10) + 1;
      await this.cacheService.set(
        key,
        attemptCount.toString(),
        SECURITY_CONFIG.LOCK_TIME,
      );
    }
  }

  async resetLoginAttempt(ip: string): Promise<void> {
    const key = `login_attempts:${ip}`;
    await this.cacheService.del(key);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `blacklisted_token:${token}`;
    return await this.cacheService.exists(key);
  }

  async blacklistToken(token: string, userId: string): Promise<void> {
    const key = `blacklisted_token:${token}`;
    // Stocker le token avec l'ID utilisateur pour l'audit
    await this.cacheService.set(key, userId, 24 * 60 * 60); // 24h (durée max du token)
  }

  async isTokenIssuedBeforePasswordChange(
    userId: string,
    issuedAt: number,
  ): Promise<boolean> {
    try {
      const key = `password_changed:${userId}`;
      const passwordChangeTimestamp = await this.cacheService.get(key);

      if (!passwordChangeTimestamp) {
        return false;
      }

      const changeTime = parseInt(passwordChangeTimestamp, 10);
      const tokenIssuedTime = issuedAt * 1000; // Convertir en millisecondes

      return tokenIssuedTime < changeTime;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la vérification du timestamp: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      return false;
    }
  }

  // Méthodes utilitaires pour la sécurité

  async markPasswordChanged(userId: string): Promise<void> {
    const key = `password_changed:${userId}`;
    const timestamp = Date.now().toString();
    // Conserver pendant 7 jours (plus long que la durée de vie des tokens)
    await this.cacheService.set(key, timestamp, 7 * 24 * 60 * 60);
  }

  async getLoginAttempts(ip: string): Promise<number> {
    const key = `login_attempts:${ip}`;
    const attempts = await this.cacheService.get(key);
    return attempts ? parseInt(attempts, 10) : 0;
  }

  getRemainingLockTime(): Promise<number> {
    // Cette méthode nécessiterait une implémentation spécifique selon le cache utilisé
    // Pour Redis, on pourrait utiliser TTL
    // TODO: Implémenter avec la méthode TTL du cache
    return Promise.resolve(0);
  }

  async cleanupExpiredTokens(): Promise<void> {
    // Méthode pour nettoyer les tokens expirés en arrière-plan
    // TODO: Implémenter selon les besoins
  }

  // Validation des IPs
  isValidIP(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    return (
      ipv4Regex.test(ip) ||
      ipv6Regex.test(ip) ||
      ip === '::1' ||
      ip === 'localhost'
    );
  }

  // Détection d'activité suspecte
  async detectSuspiciousActivity(ip: string): Promise<boolean> {
    const attempts = await this.getLoginAttempts(ip);

    // Activité suspecte si plus de 3 tentatives en peu de temps
    if (attempts > 3) {
      return true;
    }

    // TODO: Ajouter d'autres heuristiques de détection
    // - Tentatives depuis plusieurs IPs pour le même utilisateur
    // - Pattern d'attaque par force brute
    // - Géolocalisation inhabituelle

    return false;
  }

  // Rate limiting générique
  async checkRateLimit(
    identifier: string,
    maxRequests: number,
    windowMs: number,
  ): Promise<boolean> {
    const key = `rate_limit:${identifier}`;
    const requests = await this.cacheService.get(key);

    if (!requests) {
      await this.cacheService.set(key, '1', Math.floor(windowMs / 1000));
      return true;
    }

    const requestCount = parseInt(requests, 10);
    if (requestCount >= maxRequests) {
      return false;
    }

    await this.cacheService.set(
      key,
      (requestCount + 1).toString(),
      Math.floor(windowMs / 1000),
    );
    return true;
  }
}
