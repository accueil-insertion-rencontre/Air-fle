import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Headers de sécurité
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=()',
    );

    // Content Security Policy
    const isProd = process.env.NODE_ENV === 'production';
    const csp = [
      "default-src 'self'",
      // Interdire 'unsafe-eval' partout
      isProd ? "script-src 'self'" : "script-src 'self' 'unsafe-inline'",
      isProd ? "style-src 'self'" : "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' https:",
      // Autoriser les appels API locaux en dev, restreindre en prod
      isProd
        ? "connect-src 'self'"
        : "connect-src 'self' http://api-dev:3000 http://localhost:3000",
      "frame-ancestors 'none'",
    ].join('; ');
    res.setHeader('Content-Security-Policy', csp);

    // HSTS (HTTP Strict Transport Security) - seulement en production
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    }

    next();
  }
}
