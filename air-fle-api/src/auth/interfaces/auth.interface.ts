export interface IAuthenticationService {
  login(loginDto: any, ip: string): Promise<AuthResult>;
  logout(token: string, userId: string, ip: string): Promise<void>;
  validateUser(email: string, password: string): Promise<any>;
}

export interface IPasswordService {
  changePassword(userId: string, dto: any, ip: string): Promise<void>;
  requestPasswordReset(dto: any, ip: string): Promise<void>;
  confirmPasswordReset(dto: any, ip: string): Promise<void>;
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
  sign(payload: any, options?: any): string;
  verify(token: string): any;
  decode(token: string): any;
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
  user?: any;
  message?: string;
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
