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
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { StudentService } from './student.service';
import { Prisma, Student } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentDisabilityDto } from './dto/student-disability.dto';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('students')
@ApiBearerAuth()
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Créer un étudiant' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Étudiant créé avec succès',
  })
  @ApiBody({ type: CreateStudentDto })
  async create(@Body() createStudentDto: CreateStudentDto): Promise<Student> {
    return this.studentService.create(createStudentDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Récupérer tous les étudiants' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des étudiants récupérée avec succès',
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
    name: 'orderBy',
    required: false,
    description: 'Tri des résultats (JSON)',
  })
  @ApiQuery({
    name: 'student_firstname',
    required: false,
    description: 'Filtre sur le prénom',
  })
  @ApiQuery({
    name: 'student_lastname',
    required: false,
    description: 'Filtre sur le nom',
  })
  @ApiQuery({
    name: 'student_mail',
    required: false,
    description: "Filtre sur l'email",
  })
  @ApiQuery({
    name: 'french_level_uuid',
    required: false,
    description: 'Filtre sur le niveau de français',
  })
  @ApiQuery({
    name: 'group_uuid',
    required: false,
    description: 'Filtre sur le groupe',
  })
  @ApiQuery({
    name: 'nationality_uuid',
    required: false,
    description: 'Filtre sur la nationalité',
  })
  @ApiQuery({
    name: 'status_uuid',
    required: false,
    description: 'Filtre sur le statut',
  })
  @ApiQuery({
    name: 'financing_uuid',
    required: false,
    description: 'Filtre sur le financement',
  })
  @ApiQuery({
    name: 'orientation_uuid',
    required: false,
    description: "Filtre sur l'orientation",
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Recherche globale sur prénom, nom ou les deux',
  })
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('orderBy') orderBy?: string,
    @Query('student_firstname') student_firstname?: string,
    @Query('student_lastname') student_lastname?: string,
    @Query('student_mail') student_mail?: string,
    @Query('french_level_uuid') french_level_uuid?: string,
    @Query('group_uuid') group_uuid?: string,
    @Query('nationality_uuid') nationality_uuid?: string,
    @Query('status_uuid') status_uuid?: string,
    @Query('financing_uuid') financing_uuid?: string,
    @Query('orientation_uuid') orientation_uuid?: string,
    @Query('search') search?: string,
  ): Promise<any> {
    const where: Prisma.StudentWhereInput = {};

    if (search) {
      const searchTerms = search.split(/\s+/).filter(Boolean);
      where.OR = [
        ...searchTerms.map((term) => ({
          student_firstname: { contains: term, mode: 'insensitive' as const },
        })),
        ...searchTerms.map((term) => ({
          student_lastname: { contains: term, mode: 'insensitive' as const },
        })),
        {
          AND: searchTerms.map((term) => ({
            OR: [
              {
                student_firstname: {
                  contains: term,
                  mode: 'insensitive' as const,
                },
              },
              {
                student_lastname: {
                  contains: term,
                  mode: 'insensitive' as const,
                },
              },
            ],
          })),
        },
        {
          AND: [
            {
              student_firstname: {
                contains: searchTerms[0],
                mode: 'insensitive' as const,
              },
            },
            searchTerms[1]
              ? {
                  student_lastname: {
                    contains: searchTerms[1],
                    mode: 'insensitive' as const,
                  },
                }
              : {},
          ],
        },
      ];
    } else {
      if (student_firstname) {
        where.student_firstname = {
          contains: student_firstname,
          mode: 'insensitive' as const,
        };
      }
      if (student_lastname) {
        where.student_lastname = {
          contains: student_lastname,
          mode: 'insensitive' as const,
        };
      }
      if (student_mail) {
        where.student_mail = {
          contains: student_mail,
          mode: 'insensitive' as const,
        };
      }
    }
    if (french_level_uuid) {
      where.french_level_uuid = french_level_uuid;
    }
    if (group_uuid) {
      where.groups = { some: { group_uuid } };
    }
    if (nationality_uuid) {
      where.nationalities = { some: { nationality_uuid } };
    }
    if (status_uuid) {
      where.status_uuid = status_uuid;
    }
    if (financing_uuid) {
      where.financing_uuid = financing_uuid;
    }
    if (orientation_uuid) {
      where.orientation_uuid = orientation_uuid;
    }

    const page = skip ? Math.floor(Number(skip) / Number(take || 10)) + 1 : 1;
    const pageSize = take ? Number(take) : 10;
    const students = await this.studentService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where,
      orderBy: orderBy
        ? JSON.parse(orderBy)
        : { student_created_at: 'desc' as const },
    });
    // Calcul du total réel
    const total = await this.studentService.count(where);
    const totalPages = Math.ceil(total / pageSize);
    return {
      students,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  @Get(':student_uuid')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Récupérer un étudiant par UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Étudiant récupéré avec succès',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Étudiant non trouvé',
  })
  @ApiParam({ name: 'student_uuid', description: "UUID de l'étudiant" })
  async findOne(@Param('student_uuid') student_uuid: string): Promise<Student> {
    const student = await this.studentService.findOne({
      student_uuid: student_uuid,
    });

    if (!student) {
      throw new NotFoundException(
        `Étudiant avec l'UUID ${student_uuid} non trouvé`,
      );
    }

    return student;
  }

  @Patch(':student_uuid')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Mettre à jour un étudiant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Étudiant mis à jour avec succès',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Étudiant non trouvé',
  })
  @ApiParam({ name: 'student_uuid', description: "UUID de l'étudiant" })
  @ApiBody({ type: UpdateStudentDto })
  async update(
    @Param('student_uuid') student_uuid: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ): Promise<Student> {
    try {
      return await this.studentService.update({
        where: { student_uuid: student_uuid },
        data: updateStudentDto,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Étudiant avec l'UUID ${student_uuid} non trouvé`,
        );
      }
      throw error;
    }
  }

  @Delete(':student_uuid')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Supprimer un étudiant' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Étudiant supprimé avec succès',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Étudiant non trouvé',
  })
  @ApiParam({ name: 'student_uuid', description: "UUID de l'étudiant" })
  async remove(@Param('student_uuid') student_uuid: string): Promise<void> {
    try {
      await this.studentService.remove({ student_uuid: student_uuid });
      return;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Étudiant avec l'UUID ${student_uuid} non trouvé`,
        );
      }
      throw error;
    }
  }

  @Post(':student_uuid/disabilities')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @ApiOperation({ summary: 'Associer des handicaps à un étudiant' })
  @ApiResponse({ status: 200, description: 'Handicaps associés avec succès' })
  @ApiResponse({ status: 404, description: 'Étudiant introuvable' })
  @ApiParam({
    name: 'student_uuid',
    description: "UUID de l'étudiant",
    example: 'abc123-def456-ghi789',
  })
  @ApiBody({ type: StudentDisabilityDto })
  async updateStudentDisabilities(
    @Param('student_uuid') student_uuid: string,
    @Body() studentDisabilityDto: StudentDisabilityDto,
  ) {
    const student = await this.studentService.findOne(student_uuid);
    if (!student) {
      throw new NotFoundException(
        `Étudiant avec l'UUID ${student_uuid} non trouvé`,
      );
    }

    await this.studentService.updateStudentDisabilities(
      student_uuid,
      studentDisabilityDto.disability_ids,
    );
    return { success: true, message: 'Handicaps associés avec succès' };
  }
}
