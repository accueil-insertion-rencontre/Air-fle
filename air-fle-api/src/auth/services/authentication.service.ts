import {
  Injectable,
  UnauthorizedException,
  Inject,
  Logger,
} from '@nestjs/common';
import {
  IAuthenticationService,
  ITokenService,
  ISecurityService,
  IAuditService,
  IPermissionService,
  AuthResult,
} from '../interfaces/auth.interface';
import { LoginDto } from '../dto/login.dto';
import { UserService } from '../../user/user.service';
import * as argon2 from 'argon2';

@Injectable()
export class AuthenticationService implements IAuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);
  constructor(
    @Inject('ITokenService') private readonly tokenService: ITokenService,
    private readonly userService: UserService,
    @Inject('ISecurityService')
    private readonly securityService: ISecurityService,
    @Inject('IAuditService') private readonly auditService: IAuditService,
    @Inject('IPermissionService')
    private readonly permissionService: IPermissionService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.userService.findByEmailWithPassword(email);
      if (!user) {
        return null;
      }

      // Vérifier si le compte est actif
      if (user.user_isactive === false) {
        return null;
      }

      let isPasswordValid = false;
      try {
        isPasswordValid = await argon2.verify(user.user_password, password);
      } catch (error) {
        // Utiliser le service d'audit au lieu de console.error
        await this.auditService.logAuthEvent(
          null,
          'password_verification_error',
          `Erreur lors de la vérification du mot de passe: ${error.message}`,
          'internal',
        );
        return null;
      }

      if (!isPasswordValid) {
        return null;
      }

      const { user_password: _, ...result } = user;
      return result;
    } catch (error) {
      // Utiliser le service d'audit au lieu de console.error
      await this.auditService.logAuthEvent(
        null,
        'user_validation_error',
        `Erreur lors de la validation de l'utilisateur: ${error.message}`,
        'internal',
      );
      return null;
    }
  }

  async login(loginDto: LoginDto, ip: string): Promise<AuthResult> {
    const { email, password } = loginDto;

    try {
      // 1. Vérifier si l'IP est bloquée
      if (await this.securityService.isIPBlocked(ip)) {
        await this.auditService.logAuthEvent(
          null,
          'account_locked',
          `Tentative de connexion bloquée - trop de tentatives depuis ${ip}`,
          ip,
        );
        return {
          success: false,
          message: 'Trop de tentatives de connexion. Réessayez plus tard.',
        };
      }

      // 2. Valider les identifiants
      const user = await this.validateUser(email, password);
      if (!user) {
        // Incrémenter les tentatives pour cette IP
        await this.securityService.incrementLoginAttempt(ip);

        await this.auditService.logAuthEvent(
          null,
          'login_failed',
          `Tentative de connexion échouée pour ${email}`,
          ip,
        );

        return {
          success: false,
          message: 'Email ou mot de passe invalide',
        };
      }

      // 3. Générer le token
      const permissions = this.permissionService.getPermissionsByRole(
        user.role?.role_name,
      );

      const payload = {
        sub: user.user_uuid,
        email: user.user_mail,
        role: user.role?.role_name,
        permissions,
      };

      const access_token = this.tokenService.sign(payload);

      await this.securityService.resetLoginAttempt(ip);

      await this.auditService.logAuthEvent(
        user.user_uuid,
        'login_success',
        'Connexion réussie',
        ip,
      );

      return {
        success: true,
        access_token,
        user: {
          id: user.user_uuid,
          email: user.user_mail,
          firstname: user.user_firstname,
          lastname: user.user_lastname,
          role: user.role?.role_name,
          permissions,
        },
      };
    } catch (error) {
      // Pas de console en prod, on loggue via audit + logger API HTTP

      await this.auditService.logAuthEvent(
        null,
        'login_failed',
        `Erreur système lors de la connexion: ${error?.message}`,
        ip,
      );

      return {
        success: false,
        message: 'Erreur interne du serveur',
      };
    }
  }

  async logout(token: string, userId: string, ip: string): Promise<void> {
    try {
      // 1. Ajouter le token à la liste noire
      await this.securityService.blacklistToken(token, userId);

      // 2. Logger la déconnexion
      await this.auditService.logAuthEvent(
        userId,
        'logout',
        'Déconnexion réussie',
        ip,
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors de la déconnexion: ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }
}
