import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

// Services
import { AuthenticationService } from './services/authentication.service';
import { PasswordService } from './services/password.service';
import { SecurityService } from './services/security.service';
import { PermissionService } from './services/permission.service';
import { AuditService } from './services/audit.service';

// Adapters
import { JwtTokenAdapter } from './adapters/jwt-token.adapter';
import { RedisCacheAdapter } from './adapters/redis-cache.adapter';

// Strategies et Guards (inchangés)
import { JwtStrategy } from './strategies/jwt.strategy';

// Middlewares
import { SecurityMiddleware } from './middleware/security.middleware';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';

// Controllers
import { AuthController } from './controllers/auth.controller';

// Modules dépendants
import { UserModule } from '../user/user.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    UserModule,
    PassportModule,
    PrismaModule,
    RedisModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Services principaux
    AuthenticationService,
    PasswordService,
    SecurityService,
    PermissionService,
    AuditService,

    // Middlewares
    SecurityMiddleware,
    RateLimitMiddleware,

    // Adapters avec injection d'interface
    JwtTokenAdapter,
    RedisCacheAdapter,

    // Injection des interfaces
    {
      provide: 'IAuthenticationService',
      useClass: AuthenticationService,
    },
    {
      provide: 'IPasswordService',
      useClass: PasswordService,
    },
    {
      provide: 'ISecurityService',
      useClass: SecurityService,
    },
    {
      provide: 'IPermissionService',
      useClass: PermissionService,
    },
    {
      provide: 'IAuditService',
      useClass: AuditService,
    },
    {
      provide: 'ITokenService',
      useClass: JwtTokenAdapter,
    },
    {
      provide: 'ICacheService',
      useClass: RedisCacheAdapter,
    },

    // Strategy (mise à jour nécessaire)
    JwtStrategy,
  ],
  exports: [
    'IAuthenticationService',
    'IPasswordService',
    'ISecurityService',
    'IPermissionService',
    'IAuditService',
    // Exports pour rétrocompatibilité si nécessaire
    AuthenticationService,
    SecurityService,
    PermissionService,
  ],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Appliquer les middlewares de sécurité dans l'ordre
    consumer.apply(SecurityMiddleware).forRoutes('*'); // Tous les endpoints

    consumer
      .apply(RateLimitMiddleware)
      .forRoutes('auth/*', 'users/*', 'students/*'); // Endpoints sensibles
  }
}
