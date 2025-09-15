import { JwtSignOptions } from '@nestjs/jwt';
import { LoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ResetPasswordConfirmDto } from '../dto/reset-password.dto';

export interface IAuthenticationService {
  login(loginDto: LoginDto, ip: string): Promise<AuthResult>;
  logout(token: string, userId: string, ip: string): Promise<void>;
  validateUser(email: string, password: string): Promise<ValidatedUser | null>;
}

export interface IPasswordService {
  changePassword(
    userId: string,
    dto: ChangePasswordDto,
    ip: string,
  ): Promise<void>;
  requestPasswordReset(dto: { email: string }, ip: string): Promise<void>;
  confirmPasswordReset(dto: ResetPasswordConfirmDto, ip: string): Promise<void>;
}

export interface ISecurityService {
  isIPBlocked(ip: string): Promise<boolean>;
  incrementLoginAttempt(ip: string): Promise<void>;
  resetLoginAttempt(ip: string): Promise<void>;
  isTokenBlacklisted(token: string): Promise<boolean>;
  blacklistToken(token: string, userId: string): Promise<void>;
  isTokenIssuedBeforePasswordChange(
    userId: string,
    issuedAt: number,
  ): Promise<boolean>;
}

export interface IPermissionService {
  getPermissionsByRole(role: string): string[];
  getUserPermissions(userId: string): Promise<string[]>;
  hasPermission(userId: string, permission: string): Promise<boolean>;
  getAllAvailablePermissions(): string[];
  getAllRolesWithPermissions(): { name: string; permissions: string[] }[];
  getResourcesForUser(userId: string): Promise<string[]>;
  getAllRolesFromDb(): Promise<{ role_uuid: string; role_name: string }[]>;
}

export interface IAuditService {
  logAuthEvent(
    userId: string | null,
    event: SecurityEvent,
    details: string,
    ip: string,
  ): Promise<void>;
}

export interface ITokenService {
  sign(payload: string | Buffer | object, options?: JwtSignOptions): string;
  verify<T extends object = Record<string, unknown>>(token: string): T;
  decode<T = Record<string, unknown>>(token: string): T | null;
}

export interface ICacheService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

// Types de résultat
export interface AuthResult {
  success: boolean;
  access_token?: string;
  user?: ValidatedUser;
  message?: string;
}

export interface ValidatedUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  [key: string]: unknown;
}

export type SecurityEvent =
  | 'login_success'
  | 'login_failed'
  | 'account_locked'
  | 'account_disabled'
  | 'password_changed'
  | 'password_reset_requested'
  | 'password_reset_success'
  | 'logout'
  | 'token_blacklisted'
  | 'password_verification_error'
  | 'user_validation_error';

// Configuration des permissions
export interface PermissionConfig {
  [role: string]: string[];
}
