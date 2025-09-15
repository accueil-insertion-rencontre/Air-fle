import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { AbsenceService } from './absence.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Prisma } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { UpdateAbsenceDto } from './dto/update-absence.dto';

@ApiTags('absences')
@ApiBearerAuth()
@Controller('absences')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AbsenceController {
  constructor(private readonly absenceService: AbsenceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Créer une nouvelle absence' })
  @ApiResponse({
    status: 201,
    description: 'Absence créée avec succès',
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({
    status: 409,
    description: 'Une absence existe déjà pour cet étudiant et ce cours',
  })
  @ApiBody({ type: CreateAbsenceDto })
  async create(@Body() createAbsenceDto: CreateAbsenceDto) {
    // Vérifier si une absence existe déjà pour cet étudiant et ce cours
    const existingAbsence = await this.absenceService.checkExistingAbsence(
      createAbsenceDto.student_uuid,
      createAbsenceDto.course_uuid,
    );

    if (existingAbsence) {
      throw new ConflictException(
        "Une absence existe déjà pour cet étudiant et ce cours. Un étudiant ne peut avoir qu'une seule absence par cours.",
      );
    }

    const createAbsenceData: Prisma.AbsenceCreateInput = {
      student: { connect: { student_uuid: createAbsenceDto.student_uuid } },
      course: { connect: { course_uuid: createAbsenceDto.course_uuid } },
      absence_reason: createAbsenceDto.absence_reason,
    };

    return this.absenceService.create(createAbsenceData);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Récupérer toutes les absences' })
  @ApiResponse({
    status: 200,
    description: 'Liste des absences récupérée avec succès',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    description: "Nombre d'éléments à sauter",
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description: "Nombre d'éléments à prendre",
  })
  @ApiQuery({
    name: 'student_uuid',
    required: false,
    description: "UUID de l'étudiant",
  })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('student_uuid') student_uuid?: string,
  ) {
    const params = {
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      where: student_uuid ? { student_uuid } : undefined,
    };

    return this.absenceService.findAll(params);
  }

  @Get(':id')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Récupérer une absence par ID' })
  @ApiResponse({ status: 200, description: 'Absence récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Absence non trouvée' })
  @ApiParam({ name: 'id', description: "UUID de l'absence" })
  async findOne(@Param('id') id: string) {
    const absence = await this.absenceService.findOne(id);

    if (!absence) {
      throw new NotFoundException('Absence non trouvée');
    }

    return absence;
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Mettre à jour une absence' })
  @ApiResponse({
    status: 200,
    description: 'Absence mise à jour avec succès',
  })
  @ApiResponse({ status: 404, description: 'Absence non trouvée' })
  @ApiParam({ name: 'id', description: "UUID de l'absence" })
  @ApiBody({ type: UpdateAbsenceDto })
  async update(
    @Param('id') id: string,
    @Body() updateAbsenceDto: UpdateAbsenceDto,
  ) {
    const updateAbsenceData: Prisma.AbsenceUpdateInput = {};

    if (updateAbsenceDto.absence_reason !== undefined) {
      updateAbsenceData.absence_reason = updateAbsenceDto.absence_reason;
    }

    if (updateAbsenceDto.student_uuid) {
      updateAbsenceData.student = {
        connect: { student_uuid: updateAbsenceDto.student_uuid },
      };
    }

    if (updateAbsenceDto.course_uuid) {
      updateAbsenceData.course = {
        connect: { course_uuid: updateAbsenceDto.course_uuid },
      };
    }

    return this.absenceService.update(id, updateAbsenceData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Supprimer une absence' })
  @ApiResponse({ status: 200, description: 'Absence supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Absence non trouvée' })
  @ApiParam({ name: 'id', description: "UUID de l'absence" })
  async remove(@Param('id') id: string) {
    return this.absenceService.remove(id);
  }
}
