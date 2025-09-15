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
import { ExamService } from './exam.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { CreateStudentExamDto } from './dto/create-student-exam.dto';
import { UpdateStudentExamDto } from './dto/update-student-exam.dto';
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

@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('exams')
@ApiBearerAuth()
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Get()
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Récupérer tous les examens' })
  @ApiResponse({
    status: 200,
    description: 'Liste des examens récupérée avec succès',
  })
  findAll() {
    return this.examService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Récupérer un examen par ID' })
  @ApiResponse({ status: 200, description: 'Examen récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Examen non trouvé' })
  @ApiParam({ name: 'id', description: "UUID de l'examen" })
  findOne(@Param('id') id: string) {
    return this.examService.findOne(id);
  }

  @Post()
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Créer un nouvel examen' })
  @ApiResponse({ status: 201, description: 'Examen créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiBody({ type: CreateExamDto })
  create(@Body() createExamDto: CreateExamDto) {
    return this.examService.create(createExamDto);
  }

  @Patch(':id')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Mettre à jour un examen' })
  @ApiResponse({ status: 200, description: 'Examen mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Examen non trouvé' })
  @ApiParam({ name: 'id', description: "UUID de l'examen" })
  @ApiBody({ type: UpdateExamDto })
  update(@Param('id') id: string, @Body() updateExamDto: UpdateExamDto) {
    return this.examService.update(id, updateExamDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Supprimer un examen' })
  @ApiResponse({ status: 200, description: 'Examen supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Examen non trouvé' })
  @ApiParam({ name: 'id', description: "UUID de l'examen" })
  remove(@Param('id') id: string) {
    return this.examService.delete(id);
  }

  // Nouvelles routes pour gérer les StudentExam
  @Post('student')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Ajouter un étudiant à un examen' })
  @ApiResponse({
    status: 201,
    description: "Étudiant ajouté à l'examen avec succès",
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiBody({ type: CreateStudentExamDto })
  addStudentToExam(@Body() createStudentExamDto: CreateStudentExamDto) {
    return this.examService.addStudentToExam(createStudentExamDto);
  }

  @Patch('student/:studentUuid/:examUuid')
  @Roles('admin', 'teacher')
  @ApiOperation({
    summary: "Mettre à jour le score d'un étudiant pour un examen",
  })
  @ApiResponse({ status: 200, description: 'Score mis à jour avec succès' })
  @ApiResponse({
    status: 404,
    description: "Participation à l'examen non trouvée",
  })
  @ApiParam({ name: 'studentUuid', description: "UUID de l'étudiant" })
  @ApiParam({ name: 'examUuid', description: "UUID de l'examen" })
  @ApiBody({ type: UpdateStudentExamDto })
  updateStudentExam(
    @Param('studentUuid') studentUuid: string,
    @Param('examUuid') examUuid: string,
    @Body() updateStudentExamDto: UpdateStudentExamDto,
  ) {
    return this.examService.updateStudentExam(
      studentUuid,
      examUuid,
      updateStudentExamDto,
    );
  }

  @Delete('student/:studentUuid/:examUuid')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: "Retirer un étudiant d'un examen" })
  @ApiResponse({
    status: 200,
    description: "Étudiant retiré de l'examen avec succès",
  })
  @ApiResponse({
    status: 404,
    description: "Participation à l'examen non trouvée",
  })
  @ApiParam({ name: 'studentUuid', description: "UUID de l'étudiant" })
  @ApiParam({ name: 'examUuid', description: "UUID de l'examen" })
  removeStudentFromExam(
    @Param('studentUuid') studentUuid: string,
    @Param('examUuid') examUuid: string,
  ) {
    return this.examService.removeStudentFromExam(studentUuid, examUuid);
  }

  @Get(':examUuid/students')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: "Récupérer tous les étudiants d'un examen" })
  @ApiResponse({
    status: 200,
    description: 'Liste des étudiants récupérée avec succès',
  })
  @ApiParam({ name: 'examUuid', description: "UUID de l'examen" })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  getStudentsByExam(
    @Param('examUuid') examUuid: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.examService.getStudentsByExam(examUuid, page, pageSize);
  }

  @Get('student/:studentUuid')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: "Récupérer tous les examens d'un étudiant" })
  @ApiResponse({
    status: 200,
    description: 'Liste des examens récupérée avec succès',
  })
  @ApiParam({ name: 'studentUuid', description: "UUID de l'étudiant" })
  getExamsByStudent(@Param('studentUuid') studentUuid: string) {
    return this.examService.getExamsByStudent(studentUuid);
  }

  @Post('group/:examUuid/:groupUuid')
  @Roles('admin', 'teacher')
  @ApiOperation({
    summary: "Ajouter tous les étudiants d'un groupe à un examen",
  })
  @ApiResponse({
    status: 201,
    description: "Étudiants du groupe ajoutés à l'examen avec succès",
  })
  @ApiResponse({ status: 404, description: 'Examen ou groupe non trouvé' })
  @ApiParam({ name: 'examUuid', description: "UUID de l'examen" })
  @ApiParam({ name: 'groupUuid', description: 'UUID du groupe' })
  @ApiQuery({
    name: 'defaultScore',
    required: false,
    description: 'Score par défaut pour tous les étudiants',
  })
  @ApiQuery({
    name: 'defaultStatus',
    required: false,
    description: 'Statut par défaut pour tous les étudiants',
  })
  addGroupToExam(
    @Param('examUuid') examUuid: string,
    @Param('groupUuid') groupUuid: string,
    @Query('defaultScore') defaultScore?: string,
    @Query('defaultStatus') defaultStatus?: string,
  ) {
    return this.examService.addGroupToExam(
      groupUuid,
      examUuid,
      defaultScore,
      defaultStatus,
    );
  }
}
