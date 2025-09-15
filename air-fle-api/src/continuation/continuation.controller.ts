import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ContinuationService } from './continuation.service';
import { CreateContinuationDto } from './dto/create-continuation.dto';
import { UpdateContinuationDto } from './dto/update-continuation.dto';

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
  ApiQuery,
} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';

@Controller('continuations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('continuations')
@ApiBearerAuth()
export class ContinuationController {
  constructor(private readonly continuationService: ContinuationService) {}

  @Get()
  @Roles('admin', 'teacher')
  @ApiOperation({
    summary: 'Récupérer toutes les continuations avec filtres optionnels',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des continuations récupérée avec succès',
  })
  @ApiQuery({
    name: 'student_uuid',
    required: false,
    description: "UUID de l'étudiant",
  })
  @ApiQuery({
    name: 'student_name',
    required: false,
    description: "Nom de l'étudiant",
  })
  @ApiQuery({
    name: 'date_from',
    required: false,
    description: 'Date de début (ISO)',
  })
  @ApiQuery({
    name: 'date_to',
    required: false,
    description: 'Date de fin (ISO)',
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
  findAll(
    @Query('student_uuid') studentUuid?: string,
    @Query('student_name') studentName?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    // TODO: These filters should be used when the service method is updated to accept them
    // const filters = {
    //   student_uuid: studentUuid,
    //   student_name: studentName,
    //   date_from: dateFrom,
    //   date_to: dateTo,
    // };

    const pagination = {
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    };

    return this.continuationService.findAllGeneral(pagination);
  }

  @Get('student/:studentId')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: "Récupérer toutes les continuations d'un étudiant" })
  @ApiResponse({
    status: 200,
    description: 'Liste des continuations récupérée avec succès',
  })
  @ApiParam({ name: 'studentId', description: "ID de l'étudiant" })
  findAllByStudent(@Param('studentId') studentId: string) {
    return this.continuationService.findAll(studentId);
  }

  @Get(':id')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Récupérer une continuation par ID' })
  @ApiResponse({
    status: 200,
    description: 'Continuation récupérée avec succès',
  })
  @ApiResponse({ status: 404, description: 'Continuation non trouvée' })
  @ApiParam({ name: 'id', description: 'ID de la continuation' })
  findOne(@Param('id') id: string) {
    return this.continuationService.findOne(id);
  }

  @Post()
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Créer une nouvelle continuation' })
  @ApiResponse({ status: 201, description: 'Continuation créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiBody({ type: CreateContinuationDto })
  create(@Body() createContinuationDto: CreateContinuationDto) {
    const continuationData: Prisma.ContinuationCreateInput = {
      continuation_temporality: createContinuationDto.continuation_temporality,
      continuation_commentary: createContinuationDto.continuation_commentary,
      student: {
        connect: {
          student_uuid: createContinuationDto.student_uuid,
        },
      },
    };

    return this.continuationService.create(continuationData);
  }

  @Patch(':id')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Mettre à jour une continuation' })
  @ApiResponse({
    status: 200,
    description: 'Continuation mise à jour avec succès',
  })
  @ApiResponse({ status: 404, description: 'Continuation non trouvée' })
  @ApiParam({ name: 'id', description: 'ID de la continuation' })
  @ApiBody({ type: UpdateContinuationDto })
  update(
    @Param('id') id: string,
    @Body() updateContinuationDto: UpdateContinuationDto,
  ) {
    const updateData: Prisma.ContinuationUpdateInput = {};

    if (updateContinuationDto.continuation_temporality !== undefined) {
      updateData.continuation_temporality =
        updateContinuationDto.continuation_temporality;
    }
    if (updateContinuationDto.continuation_commentary !== undefined) {
      updateData.continuation_commentary =
        updateContinuationDto.continuation_commentary;
    }

    return this.continuationService.update(id, updateData);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Supprimer une continuation' })
  @ApiResponse({
    status: 200,
    description: 'Continuation supprimée avec succès',
  })
  @ApiResponse({ status: 404, description: 'Continuation non trouvée' })
  @ApiParam({ name: 'id', description: 'ID de la continuation' })
  remove(@Param('id') id: string) {
    return this.continuationService.delete(id);
  }
}
