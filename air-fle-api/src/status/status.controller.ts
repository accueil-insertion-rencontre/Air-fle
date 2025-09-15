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
import { StatusService } from './status.service';
import { Status } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Prisma } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('statuses')
@ApiBearerAuth()
@Controller('statuses')
@UseGuards(JwtAuthGuard)
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les statuts' })
  @ApiResponse({
    status: 200,
    description: 'Liste des statuts récupérée avec succès',
  })
  async findAll(): Promise<Status[]> {
    return this.statusService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un statut par ID' })
  @ApiResponse({ status: 200, description: 'Statut récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Statut non trouvé' })
  async findOne(@Param('id') id: string): Promise<Status | null> {
    return this.statusService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un statut' })
  @ApiResponse({ status: 201, description: 'Statut créé avec succès' })
  create(@Body() createStatusDto: CreateStatusDto) {
    const data: Prisma.StatusCreateInput = {
      status_label: createStatusDto.status_label,
    };

    return this.statusService.create(data);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @ApiOperation({ summary: 'Mettre à jour un statut' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Statut non trouvé' })
  @ApiParam({ name: 'id', description: 'UUID du statut' })
  @ApiBody({ type: UpdateStatusDto })
  update(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto) {
    const data: Prisma.StatusUpdateInput = {
      status_label: updateStatusDto.status_label,
    };

    return this.statusService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un statut' })
  @ApiResponse({ status: 200, description: 'Statut supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Statut non trouvé' })
  async delete(@Param('id') id: string): Promise<Status> {
    return this.statusService.delete(id);
  }
}
