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
import { ExitReasonService } from './exit-reason.service';
import { ExitReason } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateExitReasonDto } from './dto/create-exit-reason.dto';
import { UpdateExitReasonDto } from './dto/update-exit-reason.dto';
import { Prisma } from '@prisma/client';

@ApiTags('exit-reasons')
@ApiBearerAuth()
@Controller('exit-reasons')
@UseGuards(JwtAuthGuard)
export class ExitReasonController {
  constructor(private readonly exitReasonService: ExitReasonService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les raisons de sortie' })
  @ApiResponse({
    status: 200,
    description: 'Liste des raisons de sortie récupérée avec succès',
  })
  async findAll(): Promise<ExitReason[]> {
    return this.exitReasonService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une raison de sortie par ID' })
  @ApiResponse({
    status: 200,
    description: 'Raison de sortie récupérée avec succès',
  })
  @ApiResponse({ status: 404, description: 'Raison de sortie non trouvée' })
  @ApiParam({ name: 'id', description: 'ID de la raison de sortie' })
  async findOne(@Param('id') id: string): Promise<ExitReason | null> {
    return this.exitReasonService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle raison de sortie' })
  @ApiResponse({
    status: 201,
    description: 'Raison de sortie créée avec succès',
  })
  @ApiBody({ type: CreateExitReasonDto })
  async create(
    @Body() createExitReasonDto: CreateExitReasonDto,
  ): Promise<ExitReason> {
    const prismaData: Prisma.ExitReasonCreateInput = {
      exit_reason: createExitReasonDto.reason,
    };

    return this.exitReasonService.create(prismaData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une raison de sortie' })
  @ApiResponse({
    status: 200,
    description: 'Raison de sortie mise à jour avec succès',
  })
  @ApiResponse({ status: 404, description: 'Raison de sortie non trouvée' })
  @ApiParam({ name: 'id', description: 'ID de la raison de sortie' })
  @ApiBody({ type: UpdateExitReasonDto })
  async update(
    @Param('id') id: string,
    @Body() updateExitReasonDto: UpdateExitReasonDto,
  ): Promise<ExitReason> {
    const prismaData: Prisma.ExitReasonUpdateInput = {
      exit_reason: updateExitReasonDto.reason,
    };

    return this.exitReasonService.update(id, prismaData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une raison de sortie' })
  @ApiResponse({
    status: 200,
    description: 'Raison de sortie supprimée avec succès',
  })
  @ApiResponse({ status: 404, description: 'Raison de sortie non trouvée' })
  @ApiParam({ name: 'id', description: 'ID de la raison de sortie' })
  async delete(@Param('id') id: string): Promise<ExitReason> {
    return this.exitReasonService.delete(id);
  }
}
