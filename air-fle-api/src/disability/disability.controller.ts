import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { DisabilityService } from './disability.service';
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
import { CreateDisabilityDto } from './dto/create-disability.dto';
import { UpdateDisabilityDto } from './dto/update-disability.dto';

@Controller('disabilities')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('disabilities')
@ApiBearerAuth()
export class DisabilityController {
  constructor(private readonly disabilityService: DisabilityService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin')
  @ApiOperation({ summary: 'Créer un nouveau handicap' })
  @ApiResponse({ status: 201, description: 'Handicap créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiBody({ type: CreateDisabilityDto })
  create(@Body() createDisabilityDto: CreateDisabilityDto) {
    const prismaData: Prisma.DisabilityCreateInput = {
      disability_label: createDisabilityDto.disability_label,
      disability_description: createDisabilityDto.disability_description,
    };

    return this.disabilityService.create(prismaData);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Récupérer tous les handicaps' })
  @ApiResponse({
    status: 200,
    description: 'Liste des handicaps récupérée avec succès',
  })
  findAll() {
    return this.disabilityService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Récupérer un handicap par ID' })
  @ApiResponse({ status: 200, description: 'Handicap récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Handicap non trouvé' })
  @ApiParam({ name: 'id', description: 'UUID du handicap' })
  findOne(@Param('id') id: string) {
    return this.disabilityService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @ApiOperation({ summary: 'Mettre à jour un handicap' })
  @ApiResponse({ status: 200, description: 'Handicap mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Handicap non trouvé' })
  @ApiParam({ name: 'id', description: 'UUID du handicap' })
  @ApiBody({ type: UpdateDisabilityDto })
  update(
    @Param('id') id: string,
    @Body() updateDisabilityDto: UpdateDisabilityDto,
  ) {
    const prismaData: Prisma.DisabilityUpdateInput = {};

    if (updateDisabilityDto.disability_label !== undefined) {
      prismaData.disability_label = updateDisabilityDto.disability_label;
    }
    if (updateDisabilityDto.disability_description !== undefined) {
      prismaData.disability_description =
        updateDisabilityDto.disability_description;
    }

    return this.disabilityService.update(id, prismaData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin')
  @ApiOperation({ summary: 'Supprimer un handicap' })
  @ApiResponse({ status: 204, description: 'Handicap supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Handicap non trouvé' })
  @ApiParam({ name: 'id', description: 'UUID du handicap' })
  remove(@Param('id') id: string) {
    return this.disabilityService.delete(id);
  }
}
