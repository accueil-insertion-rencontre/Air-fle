import { Injectable, Logger } from '@nestjs/common';
import { IPermissionService } from '../interfaces/auth.interface';
import { UserService } from '../../user/user.service';
import { PERMISSIONS_CONFIG } from '../config/permissions.config';
import { PrismaService } from '../../prisma/prisma.service';
import { getErrorMessage, getErrorStack } from '../../common/types/error.types';

@Injectable()
export class PermissionService implements IPermissionService {
  private readonly logger = new Logger(PermissionService.name);
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
  ) {}

  getPermissionsByRole(role: string): string[] {
    return PERMISSIONS_CONFIG[role] || [];
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const user = await this.userService.findOne(userId);
      if (!user || !user.role) {
        return [];
      }

      return this.getPermissionsByRole(user.role.role_name);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des permissions utilisateur: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      return [];
    }
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      return userPermissions.includes(permission);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la vérification des permissions: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      return false;
    }
  }

  // Méthodes utilitaires pour la gestion des permissions

  getAllAvailablePermissions(): string[] {
    const allPermissions = new Set<string>();

    Object.values(PERMISSIONS_CONFIG).forEach((permissions) => {
      permissions.forEach((permission) => allPermissions.add(permission));
    });

    return Array.from(allPermissions).sort();
  }

  getAllRolesWithPermissions(): { name: string; permissions: string[] }[] {
    return Object.entries(PERMISSIONS_CONFIG).map(
      ([roleName, permissions]) => ({
        name: roleName,
        permissions: permissions.sort(),
      }),
    );
  }

  getRolesByPermission(permission: string): string[] {
    const roles: string[] = [];

    Object.entries(PERMISSIONS_CONFIG).forEach(([role, permissions]) => {
      if (permissions.includes(permission)) {
        roles.push(role);
      }
    });

    return roles;
  }

  async hasAnyPermission(
    userId: string,
    permissions: string[],
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      return permissions.some((permission) =>
        userPermissions.includes(permission),
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors de la vérification des permissions multiples: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      return false;
    }
  }

  async hasAllPermissions(
    userId: string,
    permissions: string[],
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      return permissions.every((permission) =>
        userPermissions.includes(permission),
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors de la vérification des permissions complètes: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      return false;
    }
  }

  // Validation et parsing des permissions
  isValidPermission(permission: string): boolean {
    const allPermissions = this.getAllAvailablePermissions();
    return allPermissions.includes(permission);
  }

  parsePermission(
    permission: string,
  ): { resource: string; action: string } | null {
    const parts = permission.split(':');
    if (parts.length !== 2) {
      return null;
    }

    return {
      resource: parts[0],
      action: parts[1],
    };
  }

  getPermissionsByResource(resource: string): string[] {
    const allPermissions = this.getAllAvailablePermissions();
    return allPermissions.filter((permission) =>
      permission.startsWith(`${resource}:`),
    );
  }

  getResourcesForUser(userId: string): Promise<string[]> {
    return this.getUserPermissions(userId).then((permissions) => {
      const resources = new Set<string>();

      permissions.forEach((permission) => {
        const parsed = this.parsePermission(permission);
        if (parsed) {
          resources.add(parsed.resource);
        }
      });

      return Array.from(resources).sort();
    });
  }

  // Méthodes pour les permissions hiérarchiques (si nécessaire)
  isHigherRole(role1: string, role2: string): boolean {
    const hierarchy = ['user', 'teacher', 'admin'];
    const index1 = hierarchy.indexOf(role1);
    const index2 = hierarchy.indexOf(role2);

    return index1 > index2;
  }

  canManageUser(managerRole: string, targetRole: string): boolean {
    // Un admin peut gérer tout le monde
    if (managerRole === 'admin') {
      return true;
    }

    // Un teacher peut gérer les users
    if (managerRole === 'teacher' && targetRole === 'user') {
      return true;
    }

    return false;
  }

  // Méthodes pour permissions contextuelles
  async hasPermissionOnResource(
    userId: string,
    permission: string,
    resourceId?: string,
  ): Promise<boolean> {
    // Vérifier d'abord la permission de base
    const hasBasePermission = await this.hasPermission(userId, permission);
    if (!hasBasePermission) {
      return false;
    }

    // Si pas de contexte spécifique, la permission de base suffit
    if (!resourceId) {
      return true;
    }

    // TODO: Implémenter la logique de permissions contextuelles
    // Par exemple, un teacher peut modifier ses propres étudiants
    // mais pas ceux d'un autre teacher

    return true; // Pour l'instant, on autorise si la permission de base existe
  }

  async getAllRolesFromDb(): Promise<
    { role_uuid: string; role_name: string }[]
  > {
    return this.prisma.role.findMany({
      select: { role_uuid: true, role_name: true },
    });
  }
}
