import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SelfProfileGuard } from './guards/self-profile.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('users')
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Créer un utilisateur (admin uniquement)' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiBody({ type: CreateUserDto })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({
    summary: 'Récupérer tous les utilisateurs (admin uniquement)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des utilisateurs récupérée avec succès',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    description: "Nombre d'éléments à sauter",
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description: "Nombre d'éléments à prendre",
  })
  @ApiQuery({
    name: 'user_mail',
    required: false,
    description: "Filtre sur l'email",
  })
  @ApiQuery({
    name: 'role_uuid',
    required: false,
    description: "Filtre sur l'ID du rôle",
  })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('user_mail') user_mail?: string,
    @Query('role_uuid') role_uuid?: string,
  ) {
    const where: Prisma.UserWhereInput = {};

    if (user_mail) {
      where.user_mail = { contains: user_mail, mode: 'insensitive' };
    }

    if (role_uuid) {
      where.role_uuid = role_uuid;
    }

    return this.userService.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      where,
    });
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({
    summary: 'Récupérer un utilisateur par ID (admin uniquement)',
  })
  @ApiResponse({ status: 200, description: 'Utilisateur récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Mettre à jour un utilisateur (admin uniquement)' })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur mis à jour avec succès',
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  @ApiBody({ type: UpdateUserDto })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Patch(':id/status')
  @Roles('admin')
  @ApiOperation({
    summary: 'Activer/désactiver un utilisateur (admin uniquement)',
  })
  @ApiResponse({
    status: 200,
    description: 'Statut utilisateur mis à jour avec succès',
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  @ApiBody({ type: UpdateUserDto })
  updateStatus(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUserStatus(
      id,
      updateUserDto.user_isactive ?? true,
    );
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Supprimer un utilisateur (admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiResponse({
    status: 403,
    description:
      'Un administrateur ne peut pas supprimer son propre compte ou le dernier administrateur du système',
  })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  async remove(@Param('id') id: string, @Req() req: Request) {
    try {
      // Extraire le token JWT de l'en-tête Authorization
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1]; // Format: "Bearer <token>"

      return await this.userService.remove(id);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error; // Laisser l'exception se propager pour être traitée par NestJS
      }
      throw error;
    }
  }

  @Get('profile/:id')
  @UseGuards(JwtAuthGuard, SelfProfileGuard)
  @ApiOperation({ summary: "Récupérer le profil de l'utilisateur connecté" })
  @ApiResponse({ status: 200, description: 'Profil récupéré avec succès' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  async getProfile(@Param('id') id: string) {
    return this.userService.findOne(id);
  }
}
