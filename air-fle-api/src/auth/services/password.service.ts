import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import {
  IPasswordService,
  IAuditService,
  ISecurityService,
  ICacheService,
} from '../interfaces/auth.interface';
import { UserService } from '../../user/user.service';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { getErrorStack } from '../../common/types/error.types';
import {
  ResetPasswordRequestDto,
  ResetPasswordConfirmDto,
} from '../dto/reset-password.dto';
import { SECURITY_CONFIG } from '../config/permissions.config';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';

@Injectable()
export class PasswordService implements IPasswordService {
  private readonly logger = new Logger(PasswordService.name);
  constructor(
    private readonly userService: UserService,
    @Inject('IAuditService') private readonly auditService: IAuditService,
    @Inject('ISecurityService')
    private readonly securityService: ISecurityService,
    @Inject('ICacheService') private readonly cacheService: ICacheService,
  ) {}

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    ip: string,
  ): Promise<void> {
    const { currentPassword, newPassword } = dto;

    try {
      // 1. Récupérer l'utilisateur
      const user = await this.userService.findByIdWithPassword(userId);
      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      // 2. Vérifier le mot de passe actuel
      const isCurrentPasswordValid = await argon2.verify(
        user.user_password,
        currentPassword,
      );
      if (!isCurrentPasswordValid) {
        await this.auditService.logAuthEvent(
          userId,
          'login_failed',
          'Tentative de changement de mot de passe avec ancien mot de passe incorrect',
          ip,
        );
        throw new BadRequestException('Mot de passe actuel incorrect');
      }

      // 3. Vérifier que le nouveau mot de passe est différent
      const isSamePassword = await argon2.verify(
        user.user_password,
        newPassword,
      );
      if (isSamePassword) {
        throw new BadRequestException(
          'Le nouveau mot de passe doit être différent du mot de passe actuel',
        );
      }

      // 4. Vérifier la robustesse du nouveau mot de passe
      this.validatePasswordStrength(newPassword);

      // 5. Mettre à jour le mot de passe via UserService
      await this.userService.update(userId, {
        user_password: newPassword,
      });

      // 6. Logger l'événement
      await this.auditService.logAuthEvent(
        userId,
        'password_changed',
        'Mot de passe modifié avec succès',
        ip,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Erreur lors du changement de mot de passe: ${error instanceof Error ? error.message : 'Unknown error'}`,
        getErrorStack(error),
      );
      throw new BadRequestException(
        'Erreur lors du changement de mot de passe',
      );
    }
  }

  async requestPasswordReset(
    dto: ResetPasswordRequestDto,
    ip: string,
  ): Promise<void> {
    const { email } = dto;

    try {
      // 1. Chercher l'utilisateur par email
      const user = await this.userService.findByEmailWithPassword(email);
      if (!user) {
        // Ne pas révéler que l'email n'existe pas pour des raisons de sécurité
        await this.auditService.logAuthEvent(
          null,
          'password_reset_requested',
          `Demande de réinitialisation pour email inexistant: ${email}`,
          ip,
        );
        return; // Retourner sans erreur
      }

      // 2. Vérifier si le compte est actif
      if (user.user_isactive === false) {
        await this.auditService.logAuthEvent(
          user.user_uuid,
          'password_reset_requested',
          'Demande de réinitialisation pour compte désactivé',
          ip,
        );
        return; // Retourner sans erreur pour ne pas révéler l'état du compte
      }

      // 3. Générer un token de réinitialisation
      const resetToken = this.generateResetToken();
      const resetKey = `password_reset:${resetToken}`;

      // 4. Stocker le token avec l'ID utilisateur dans Redis
      await this.cacheService.set(
        resetKey,
        user.user_uuid,
        SECURITY_CONFIG.RESET_TOKEN_EXPIRY,
      );

      // 5. Logger la demande
      await this.auditService.logAuthEvent(
        user.user_uuid,
        'password_reset_requested',
        'Demande de réinitialisation de mot de passe initiée',
        ip,
      );

      // TODO: Envoyer l'email avec le token de réinitialisation
    } catch (error) {
      this.logger.error(
        `Erreur lors de la demande de réinitialisation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        getErrorStack(error),
      );

      await this.auditService.logAuthEvent(
        null,
        'password_reset_requested',
        `Erreur lors de la demande de réinitialisation pour ${email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ip,
      );
    }
  }

  async confirmPasswordReset(
    dto: ResetPasswordConfirmDto,
    ip: string,
  ): Promise<void> {
    const { token, password: newPassword } = dto;

    try {
      // 1. Vérifier le token
      const resetKey = `password_reset:${token}`;
      const userId = await this.cacheService.get(resetKey);

      if (!userId) {
        await this.auditService.logAuthEvent(
          null,
          'password_reset_requested',
          `Tentative d'utilisation de token invalide ou expiré: ${token.substring(0, 8)}...`,
          ip,
        );
        throw new BadRequestException(
          'Token de réinitialisation invalide ou expiré',
        );
      }

      // 2. Récupérer l'utilisateur
      const user = await this.userService.findByIdWithPassword(userId);
      if (!user) {
        await this.cacheService.del(resetKey);
        throw new NotFoundException('Utilisateur non trouvé');
      }

      // 3. Vérifier que le nouveau mot de passe est différent de l'ancien
      const isSamePassword = await argon2.verify(
        user.user_password,
        newPassword,
      );
      if (isSamePassword) {
        throw new BadRequestException(
          'Le nouveau mot de passe doit être différent du mot de passe actuel',
        );
      }

      // 4. Vérifier la robustesse du nouveau mot de passe
      this.validatePasswordStrength(newPassword);

      // 5. Mettre à jour le mot de passe via UserService
      await this.userService.update(userId, {
        user_password: newPassword,
      });

      // 6. Supprimer le token de réinitialisation
      await this.cacheService.del(resetKey);

      // 7. Logger le succès
      await this.auditService.logAuthEvent(
        userId,
        'password_reset_success',
        'Mot de passe réinitialisé avec succès',
        ip,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Erreur lors de la confirmation de réinitialisation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        getErrorStack(error),
      );
      throw new BadRequestException(
        'Erreur lors de la réinitialisation du mot de passe',
      );
    }
  }

  private generateResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException(
        'Le mot de passe doit contenir au moins 8 caractères',
      );
    }

    // Ajouter d'autres règles de validation si nécessaire
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw new BadRequestException(
        'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
      );
    }
  }
}
