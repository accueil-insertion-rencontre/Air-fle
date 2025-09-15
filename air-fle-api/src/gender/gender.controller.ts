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
import { GenderService } from './gender.service';
import { CreateGenderDto } from './dto/create-gender.dto';
import { UpdateGenderDto } from './dto/update-gender.dto';
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

@Controller('genders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('genders')
@ApiBearerAuth()
export class GenderController {
  constructor(private readonly genderService: GenderService) {}

  @Post()
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Créer un nouveau genre' })
  @ApiResponse({ status: 201, description: 'Genre créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiBody({ type: CreateGenderDto })
  create(@Body() createGenderDto: CreateGenderDto) {
    const prismaData: Prisma.GenderCreateInput = {
      gender_label: createGenderDto.gender_label,
    };

    return this.genderService.create(prismaData);
  }

  @Get()
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Récupérer tous les genres' })
  @ApiResponse({
    status: 200,
    description: 'Liste des genres récupérée avec succès',
  })
  findAll() {
    return this.genderService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Récupérer un genre par ID' })
  @ApiResponse({ status: 200, description: 'Genre récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Genre non trouvé' })
  @ApiParam({ name: 'id', description: 'UUID du genre' })
  findOne(@Param('id') id: string) {
    return this.genderService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Mettre à jour un genre' })
  @ApiResponse({ status: 200, description: 'Genre mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Genre non trouvé' })
  @ApiParam({ name: 'id', description: 'UUID du genre' })
  @ApiBody({ type: UpdateGenderDto })
  update(@Param('id') id: string, @Body() updateGenderDto: UpdateGenderDto) {
    const prismaData: Prisma.GenderUpdateInput = {};

    if (updateGenderDto.gender_label !== undefined) {
      prismaData.gender_label = updateGenderDto.gender_label;
    }

    return this.genderService.update(id, prismaData);
  }

  @Delete(':id')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Supprimer un genre' })
  @ApiResponse({ status: 200, description: 'Genre supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Genre non trouvé' })
  @ApiParam({ name: 'id', description: 'UUID du genre' })
  remove(@Param('id') id: string) {
    return this.genderService.delete(id);
  }
}
