import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Ip,
  UseGuards,
  Request,
  Patch,
  Param,
  Inject,
} from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import {
  IAuthenticationService,
  IPasswordService,
  IPermissionService,
} from '../interfaces/auth.interface';
import {
  ResetPasswordRequestDto,
  ResetPasswordConfirmDto,
} from '../dto/reset-password.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('IAuthenticationService')
    private readonly authService: IAuthenticationService,
    @Inject('IPasswordService')
    private readonly passwordService: IPasswordService,
    @Inject('IPermissionService')
    private readonly permissionService: IPermissionService,
  ) {}

  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur connecté avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '1a2b3c4d-5e6f-7g8h-9i0j' },
            email: { type: 'string', example: 'utilisateur@exemple.com' },
            firstname: { type: 'string', example: 'Jean' },
            lastname: { type: 'string', example: 'Dupont' },
            role: { type: 'string', example: 'admin' },
            permissions: {
              type: 'array',
              items: { type: 'string' },
              example: ['user:read', 'user:write'],
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Identifiants invalides ou trop de tentatives',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Email ou mot de passe invalide' },
      },
    },
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Ip() ip: string) {
    return this.authService.login(loginDto, ip);
  }

  @ApiOperation({ summary: "Déconnexion de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur déconnecté avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Déconnexion réussie' },
      },
    },
  })
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req, @Ip() ip: string) {
    const token = req.headers.authorization.split(' ')[1];
    await this.authService.logout(token, req.user.user_uuid, ip);
    return {
      success: true,
      message: 'Déconnexion réussie',
    };
  }

  @ApiOperation({ summary: 'Demande de réinitialisation de mot de passe' })
  @ApiBody({ type: ResetPasswordRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Demande de réinitialisation traitée',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example:
            'Si votre email est enregistré dans notre système, vous recevrez un lien pour réinitialiser votre mot de passe.',
        },
      },
    },
  })
  @Post('reset-password/request')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(
    @Body() dto: ResetPasswordRequestDto,
    @Ip() ip: string,
  ) {
    await this.passwordService.requestPasswordReset(dto, ip);
    return {
      success: true,
      message:
        'Si votre email est enregistré dans notre système, vous recevrez un lien pour réinitialiser votre mot de passe.',
    };
  }

  @ApiOperation({ summary: 'Confirmation de réinitialisation de mot de passe' })
  @ApiBody({ type: ResetPasswordConfirmDto })
  @ApiResponse({
    status: 200,
    description: 'Mot de passe réinitialisé avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Votre mot de passe a été réinitialisé avec succès',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token invalide ou expiré',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: {
          type: 'string',
          example: 'Token de réinitialisation invalide ou expiré',
        },
      },
    },
  })
  @Post('reset-password/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmPasswordReset(
    @Body() dto: ResetPasswordConfirmDto,
    @Ip() ip: string,
  ) {
    await this.passwordService.confirmPasswordReset(dto, ip);
    return {
      success: true,
      message: 'Votre mot de passe a été réinitialisé avec succès',
    };
  }

  @ApiOperation({
    summary: "Changement de mot de passe pour l'utilisateur connecté",
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Mot de passe modifié avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Votre mot de passe a été modifié avec succès',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Mot de passe actuel incorrect ou nouveau mot de passe invalide',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: {
          type: 'string',
          example: 'Mot de passe actuel incorrect',
        },
      },
    },
  })
  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req,
    @Body() dto: ChangePasswordDto,
    @Ip() ip: string,
  ) {
    await this.passwordService.changePassword(req.user.user_uuid, dto, ip);
    return {
      success: true,
      message: 'Votre mot de passe a été modifié avec succès',
    };
  }

  @ApiOperation({
    summary: "Récupérer les permissions de l'utilisateur connecté",
  })
  @ApiResponse({
    status: 200,
    description: 'Permissions récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        permissions: {
          type: 'array',
          items: { type: 'string' },
          example: ['user:read', 'student:write', 'admin:access'],
        },
        resources: {
          type: 'array',
          items: { type: 'string' },
          example: ['user', 'student', 'admin'],
        },
      },
    },
  })
  @Get('me/permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async getMyPermissions(@Request() req) {
    const userId = req.user.user_uuid;
    const permissions = await this.permissionService.getUserPermissions(userId);
    const resources = await this.permissionService.getResourcesForUser(userId);

    return {
      userId,
      permissions,
      resources,
    };
  }

  @ApiOperation({ summary: 'Vérifier une permission spécifique' })
  @ApiResponse({
    status: 200,
    description: 'Résultat de la vérification',
    schema: {
      type: 'object',
      properties: {
        hasPermission: { type: 'boolean' },
        permission: { type: 'string' },
        userId: { type: 'string' },
      },
    },
  })
  @Get('check-permission/:permission')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({
    name: 'permission',
    description: 'Permission à vérifier (ex: user:read)',
  })
  @HttpCode(HttpStatus.OK)
  async checkPermission(
    @Request() req,
    @Param('permission') permission: string,
  ) {
    const userId = req.user.user_uuid;
    const hasPermission = await this.permissionService.hasPermission(
      userId,
      permission,
    );

    return {
      userId,
      permission,
      hasPermission,
    };
  }

  @ApiOperation({ summary: 'Récupérer toutes les permissions disponibles' })
  @ApiResponse({
    status: 200,
    description: 'Liste de toutes les permissions disponibles',
    schema: {
      type: 'object',
      properties: {
        permissions: {
          type: 'array',
          items: { type: 'string' },
        },
        total: { type: 'number' },
      },
    },
  })
  @Get('permissions/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async getAllPermissions() {
    const permissions = this.permissionService.getAllAvailablePermissions();

    return {
      permissions,
      total: permissions.length,
    };
  }

  @Get('roles')
  @ApiOperation({
    summary: 'Get all roles from database (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of roles with UUIDs and names',
    schema: {
      type: 'object',
      properties: {
        roles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role_uuid: { type: 'string', example: '...' },
              role_name: { type: 'string', example: 'Admin' },
            },
          },
        },
        total: { type: 'number', example: 3 },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async getAllRoles() {
    // Récupère les rôles depuis la base
    const roles = await this.permissionService.getAllRolesFromDb();
    return {
      roles: roles.map((r) => ({
        role_uuid: r.role_uuid,
        role_name: r.role_name,
      })),
      total: roles.length,
    };
  }

  @Get('roles/:roleName/permissions')
  @ApiOperation({ summary: "Récupérer les permissions d'un rôle spécifique" })
  @ApiParam({
    name: 'roleName',
    description: 'Nom du rôle (admin, teacher, user)',
  })
  @ApiResponse({
    status: 200,
    description: 'Permissions du rôle récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        role: { type: 'string', example: 'admin' },
        permissions: {
          type: 'array',
          items: { type: 'string' },
          example: ['user:read', 'user:write', 'admin:access'],
        },
        total: { type: 'number', example: 25 },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async getRolePermissions(@Param('roleName') roleName: string) {
    const permissions = this.permissionService.getPermissionsByRole(roleName);

    return {
      role: roleName,
      permissions,
      total: permissions.length,
    };
  }
}
