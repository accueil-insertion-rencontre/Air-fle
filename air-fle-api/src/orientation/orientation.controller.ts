import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrientationService } from './orientation.service';
import { Orientation } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateOrientationDto } from './dto/create-orientation.dto';
import { UpdateOrientationDto } from './dto/update-orientation.dto';
import { Prisma } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('orientations')
@ApiBearerAuth()
@Controller('orientations')
@UseGuards(JwtAuthGuard)
export class OrientationController {
  constructor(private readonly orientationService: OrientationService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les orientations' })
  @ApiResponse({
    status: 200,
    description: 'Liste des orientations récupérée avec succès',
  })
  async findAll(): Promise<Orientation[]> {
    return this.orientationService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une orientation par ID' })
  @ApiResponse({
    status: 200,
    description: 'Orientation récupérée avec succès',
  })
  @ApiResponse({ status: 404, description: 'Orientation non trouvée' })
  @ApiParam({ name: 'id', description: "ID de l'orientation" })
  async findOne(@Param('id') id: string): Promise<Orientation | null> {
    return this.orientationService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une orientation' })
  @ApiResponse({ status: 201, description: 'Orientation créée avec succès' })
  @ApiBody({ type: CreateOrientationDto })
  async create(
    @Body() createOrientationDto: CreateOrientationDto,
  ): Promise<Orientation> {
    const prismaData: Prisma.OrientationCreateInput = {
      orientation_type: createOrientationDto.orientation_type,
      orientation_description:
        createOrientationDto.orientation_description || '',
    };

    return this.orientationService.create(prismaData);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @ApiOperation({ summary: 'Mettre à jour une orientation' })
  @ApiResponse({
    status: 200,
    description: 'Orientation mise à jour avec succès',
  })
  @ApiResponse({ status: 404, description: 'Orientation non trouvée' })
  @ApiParam({ name: 'id', description: "UUID de l'orientation" })
  @ApiBody({ type: UpdateOrientationDto })
  update(
    @Param('id') id: string,
    @Body() updateOrientationDto: UpdateOrientationDto,
  ) {
    const prismaData: Prisma.OrientationUpdateInput = {};

    if (updateOrientationDto.orientation_type !== undefined) {
      prismaData.orientation_type = updateOrientationDto.orientation_type;
    }
    if (updateOrientationDto.orientation_description !== undefined) {
      prismaData.orientation_description =
        updateOrientationDto.orientation_description;
    }

    return this.orientationService.update(id, prismaData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une orientation' })
  @ApiResponse({
    status: 200,
    description: 'Orientation supprimée avec succès',
  })
  @ApiResponse({ status: 404, description: 'Orientation non trouvée' })
  @ApiParam({ name: 'id', description: "UUID de l'orientation" })
  async delete(@Param('id') id: string): Promise<Orientation> {
    return this.orientationService.delete(id);
  }
}
