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
import { PeriodService } from './period.service';
import { Period } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreatePeriodDto } from './dto/create-period.dto';
import { UpdatePeriodDto } from './dto/update-period.dto';
import { Prisma } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('periods')
@ApiBearerAuth()
@Controller('periods')
@UseGuards(JwtAuthGuard)
export class PeriodController {
  constructor(private readonly periodService: PeriodService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les périodes' })
  @ApiResponse({
    status: 200,
    description: 'Liste des périodes récupérée avec succès',
  })
  async findAll(): Promise<Period[]> {
    return this.periodService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une période par ID' })
  @ApiResponse({ status: 200, description: 'Période récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Période non trouvée' })
  async findOne(@Param('id') id: string): Promise<Period | null> {
    return this.periodService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une période' })
  @ApiResponse({ status: 201, description: 'Période créée avec succès' })
  create(@Body() createPeriodDto: CreatePeriodDto) {
    const data: Prisma.PeriodCreateInput = {
      period_label: createPeriodDto.period_label,
      period_started_at: createPeriodDto.period_started_at,
      period_ended_at: createPeriodDto.period_ended_at,
      period_actual_period: createPeriodDto.period_actual_period,
    };

    return this.periodService.create(data);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @ApiOperation({ summary: 'Mettre à jour une période' })
  @ApiResponse({ status: 200, description: 'Période mise à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Période non trouvée' })
  @ApiParam({ name: 'id', description: 'UUID de la période' })
  @ApiBody({ type: UpdatePeriodDto })
  update(@Param('id') id: string, @Body() updatePeriodDto: UpdatePeriodDto) {
    const data: Prisma.PeriodUpdateInput = {};

    if (updatePeriodDto.period_label !== undefined) {
      data.period_label = updatePeriodDto.period_label;
    }
    if (updatePeriodDto.period_started_at !== undefined) {
      data.period_started_at = updatePeriodDto.period_started_at;
    }
    if (updatePeriodDto.period_ended_at !== undefined) {
      data.period_ended_at = updatePeriodDto.period_ended_at;
    }
    if (updatePeriodDto.period_actual_period !== undefined) {
      data.period_actual_period = updatePeriodDto.period_actual_period;
    }

    return this.periodService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une période' })
  @ApiResponse({ status: 200, description: 'Période supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Période non trouvée' })
  async delete(@Param('id') id: string): Promise<Period> {
    return this.periodService.delete(id);
  }
}
