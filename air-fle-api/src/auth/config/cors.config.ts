import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { Logger } from '@nestjs/common';

export const corsConfig: CorsOptions = {
  // Origines autorisées
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origine (applications mobiles, Postman, etc.)
    if (!origin) return callback(null, true);

    // Liste des domaines autorisés
    const allowedOrigins = [
      'http://localhost:3000', // Frontend React/Vue local
      'http://localhost:4200', // Frontend Angular local
      'http://localhost:8080', // Frontend Vue local alternatif
      'http://api-dev:3000', // API Docker service
      'http://46.62.162.199', // Serveur de production (front + api)
      'https://your-app.com', // Domaine de production
      'https://admin.your-app.com', // Interface admin
    ];

    // Vérifier si l'origine est autorisée
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      const logger = new Logger('CORS');
      logger.warn(`Origine non autorisée: ${origin}`);
      callback(new Error('Non autorisé par la politique CORS'), false);
    }
  },

  // Méthodes HTTP autorisées
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Headers autorisés
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
  ],

  // Headers exposés au client
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],

  // Autoriser les credentials (cookies, tokens)
  credentials: true,

  // Durée de mise en cache des preflight requests
  maxAge: 86400, // 24 heures
};

// Configuration CORS pour développement (plus permissive)
export const corsConfigDev: CorsOptions = {
  origin: true, // Autoriser toutes les origines en développement
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*',
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  credentials: true,
  maxAge: 86400,
};

// Fonction pour obtenir la configuration selon l'environnement
export function getCorsConfig(): CorsOptions {
  return process.env.NODE_ENV === 'production' ? corsConfig : corsConfigDev;
}
