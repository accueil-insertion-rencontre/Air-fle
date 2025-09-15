import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { Prisma } from '@prisma/client';

// Pour éviter l'erreur d'import de UserRole
type UserRole = 'admin' | 'teacher';
const UserRole: Record<string, UserRole> = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
};

@ApiTags('sessions')
@ApiBearerAuth()
@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Créer une nouvelle session' })
  @ApiResponse({ status: 201, description: 'Session créée avec succès' })
  async create(@Body() createSessionDto: CreateSessionDto) {
    const data: Prisma.SessionCreateInput = {
      session_label: createSessionDto.session_label || '',
      session_started_at: createSessionDto.session_started_at,
      session_finished_at: createSessionDto.session_finished_at,
    };

    return this.sessionService.create(data);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'teacher')
  @ApiOperation({
    summary: 'Récupérer toutes les sessions avec tri et pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des sessions récupérée avec succès',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    description: "Nombre d'éléments à ignorer",
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description: "Nombre d'éléments à récupérer",
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Recherche par libellé',
  })
  findAllWithOptions(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    const params = {
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      where: search
        ? {
            session_label: { contains: search, mode: 'insensitive' as const },
          }
        : undefined,
      orderBy: { session_started_at: 'desc' as const },
    };

    return this.sessionService.findAll(params);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Récupérer une session par ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session récupérée avec succès',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session non trouvée',
  })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  findOne(@Param('id') id: string) {
    return this.sessionService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @ApiOperation({ summary: 'Mettre à jour une session' })
  @ApiResponse({ status: 200, description: 'Session mise à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Session non trouvée' })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiBody({ type: UpdateSessionDto })
  update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto) {
    const data: Prisma.SessionUpdateInput = {};

    if (updateSessionDto.session_label !== undefined) {
      data.session_label = updateSessionDto.session_label;
    }
    if (updateSessionDto.session_started_at !== undefined) {
      data.session_started_at = updateSessionDto.session_started_at;
    }
    if (updateSessionDto.session_finished_at !== undefined) {
      data.session_finished_at = updateSessionDto.session_finished_at;
    }

    return this.sessionService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin')
  @ApiOperation({ summary: 'Supprimer une session' })
  @ApiResponse({ status: 204, description: 'Session supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Session non trouvée' })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  delete(@Param('id') id: string) {
    return this.sessionService.delete(id);
  }
}
