import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { NationalityService } from './nationality.service';
import { Nationality } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateNationalityDto } from './dto/create-nationality.dto';
import { UpdateNationalityDto } from './dto/update-nationality.dto';
import { Prisma } from '@prisma/client';

@ApiTags('nationalities')
@ApiBearerAuth()
@Controller('nationalities')
@UseGuards(JwtAuthGuard)
export class NationalityController {
  constructor(private readonly nationalityService: NationalityService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les nationalités' })
  @ApiResponse({
    status: 200,
    description: 'Liste des nationalités récupérée avec succès',
  })
  async findAll(): Promise<Nationality[]> {
    return this.nationalityService.findAll();
  }

  @Get(':nationality_uuid')
  @ApiOperation({ summary: 'Récupérer une nationalité par UUID' })
  @ApiResponse({
    status: 200,
    description: 'Nationalité récupérée avec succès',
  })
  @ApiResponse({ status: 404, description: 'Nationalité non trouvée' })
  @ApiParam({ name: 'nationality_uuid', description: 'UUID de la nationalité' })
  async findOne(
    @Param('nationality_uuid') nationality_uuid: string,
  ): Promise<Nationality | null> {
    return this.nationalityService.findOne(nationality_uuid);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nationalité' })
  @ApiResponse({ status: 201, description: 'Nationalité créée avec succès' })
  @ApiBody({ type: CreateNationalityDto })
  async create(
    @Body() createNationalityDto: CreateNationalityDto,
  ): Promise<Nationality> {
    const prismaData: Prisma.NationalityCreateInput = {
      nationality_label: createNationalityDto.nationality_label,
    };

    return this.nationalityService.create(prismaData);
  }

  @Put(':nationality_uuid')
  @ApiOperation({ summary: 'Mettre à jour une nationalité' })
  @ApiResponse({
    status: 200,
    description: 'Nationalité mise à jour avec succès',
  })
  @ApiResponse({ status: 404, description: 'Nationalité non trouvée' })
  @ApiParam({ name: 'nationality_uuid', description: 'UUID de la nationalité' })
  @ApiBody({ type: UpdateNationalityDto })
  async update(
    @Param('nationality_uuid') nationality_uuid: string,
    @Body() updateNationalityDto: UpdateNationalityDto,
  ): Promise<Nationality> {
    const prismaData: Prisma.NationalityUpdateInput = {};

    if (updateNationalityDto.nationality_label !== undefined) {
      prismaData.nationality_label = updateNationalityDto.nationality_label;
    }

    return this.nationalityService.update(nationality_uuid, prismaData);
  }

  @Delete(':nationality_uuid')
  @ApiOperation({ summary: 'Supprimer une nationalité' })
  @ApiResponse({
    status: 200,
    description: 'Nationalité supprimée avec succès',
  })
  @ApiResponse({ status: 404, description: 'Nationalité non trouvée' })
  @ApiParam({ name: 'nationality_uuid', description: 'UUID de la nationalité' })
  async delete(
    @Param('nationality_uuid') nationality_uuid: string,
  ): Promise<Nationality> {
    return this.nationalityService.delete(nationality_uuid);
  }
}
