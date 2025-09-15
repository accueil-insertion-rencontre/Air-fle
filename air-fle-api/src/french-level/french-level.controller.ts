import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FrenchLevelService } from './french-level.service';
import { CreateFrenchLevelDto } from './dto/create-french-level.dto';
import { UpdateFrenchLevelDto } from './dto/update-french-level.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';

@Controller('french-levels')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('french-levels')
@ApiBearerAuth()
export class FrenchLevelController {
  constructor(private readonly frenchLevelService: FrenchLevelService) {}

  @Post()
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Créer un nouveau niveau de français' })
  @ApiResponse({
    status: 201,
    description: 'Niveau de français créé avec succès',
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiBody({ type: CreateFrenchLevelDto })
  create(@Body() createFrenchLevelDto: CreateFrenchLevelDto) {
    const prismaData: Prisma.FrenchLevelCreateInput = {
      french_level_code: createFrenchLevelDto.code || '',
      french_level_description: createFrenchLevelDto.description || '',
    };

    return this.frenchLevelService.create(prismaData);
  }

  @Get()
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Récupérer tous les niveaux de français' })
  @ApiResponse({
    status: 200,
    description: 'Liste des niveaux de français récupérée avec succès',
  })
  findAll() {
    return this.frenchLevelService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Récupérer un niveau de français par ID' })
  @ApiResponse({
    status: 200,
    description: 'Niveau de français récupéré avec succès',
  })
  @ApiResponse({ status: 404, description: 'Niveau de français non trouvé' })
  @ApiParam({ name: 'id', description: 'ID du niveau de français' })
  findOne(@Param('id') id: string) {
    return this.frenchLevelService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Mettre à jour un niveau de français' })
  @ApiResponse({
    status: 200,
    description: 'Niveau de français mis à jour avec succès',
  })
  @ApiResponse({ status: 404, description: 'Niveau de français non trouvé' })
  @ApiParam({ name: 'id', description: 'ID du niveau de français' })
  @ApiBody({ type: UpdateFrenchLevelDto })
  update(
    @Param('id') id: string,
    @Body() updateFrenchLevelDto: UpdateFrenchLevelDto,
  ) {
    const prismaData: Prisma.FrenchLevelUpdateInput = {};

    if (updateFrenchLevelDto.code !== undefined) {
      prismaData.french_level_code = updateFrenchLevelDto.code;
    }

    if (updateFrenchLevelDto.description !== undefined) {
      prismaData.french_level_description = updateFrenchLevelDto.description;
    }

    return this.frenchLevelService.update(id, prismaData);
  }

  @Delete(':id')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Supprimer un niveau de français' })
  @ApiResponse({
    status: 200,
    description: 'Niveau de français supprimé avec succès',
  })
  @ApiResponse({ status: 404, description: 'Niveau de français non trouvé' })
  @ApiParam({ name: 'id', description: 'ID du niveau de français' })
  remove(@Param('id') id: string) {
    return this.frenchLevelService.delete(id);
  }
}
