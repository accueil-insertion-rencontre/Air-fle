import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        // Niveau de logs selon l'env
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

        // Pretty print en dev uniquement
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                  colorize: true,
                  translateTime: 'SYS:standard',
                  messageKey: 'message',
                },
              }
            : undefined,

        // ID de requête pour corrélation
        genReqId: (req) =>
          (req.headers['x-request-id'] as string) ||
          (req.headers['x-correlation-id'] as string) ||
          randomUUID(),

        // Redaction de champs sensibles
        redact: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
          'body.password',
          'body.*.password',
        ],

        // Ajout de props utiles
        customProps: (req) => ({
          requestId:
            (req.headers['x-request-id'] as string) ||
            (req.headers['x-correlation-id'] as string),
        }),
      },
    }),
  ],
  exports: [LoggerModule],
})
export class LoggingModule {}
