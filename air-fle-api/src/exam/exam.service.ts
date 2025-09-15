import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, StudentExam, Student, Exam } from '@prisma/client';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { CreateStudentExamDto } from './dto/create-student-exam.dto';
import { UpdateStudentExamDto } from './dto/update-student-exam.dto';

@Injectable()
export class ExamService {
  private readonly logger = new Logger(ExamService.name);
  constructor(
    private prisma: PrismaService,
    // learnerHistory removed
  ) {}

  async findOne(id: string) {
    return this.prisma.exam.findUnique({
      where: { exam_uuid: id },
      include: {
        students: {
          include: {
            student: true,
          },
        },
      },
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.ExamWhereInput;
    orderBy?: Prisma.ExamOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};

    const [exams, total] = await Promise.all([
      this.prisma.exam.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          students: {
            include: {
              student: true,
            },
          },
        },
      }),
      this.prisma.exam.count({ where }),
    ]);

    return {
      data: exams,
      meta: {
        total,
        skip: skip || 0,
        take: take || total,
      },
    };
  }

  async create(createExamDto: CreateExamDto) {
    const { students, ...examData } = createExamDto;

    const exam = await this.prisma.$transaction(async (tx) => {
      // Créer l'examen
      const createdExam = await tx.exam.create({
        data: {
          exam_label: examData.exam_label,
          exam_taked_at: new Date(examData.exam_taked_at),
          exam_type: examData.exam_type || 'written',
        },
        include: {
          students: {
            include: {
              student: true,
            },
          },
        },
      });

      // Ajouter les étudiants si fournis
      if (students && students.length > 0) {
        for (const studentExam of students) {
          await tx.studentExam.create({
            data: {
              student_uuid: studentExam.student_uuid,
              exam_uuid: createdExam.exam_uuid,
              exam_score: studentExam.exam_score,
              exam_status: studentExam.exam_status || 'pending',
              exam_notes: studentExam.exam_notes,
            },
          });

          // Historique désactivé
        }
      }

      return createdExam;
    });

    this.logger.log(
      JSON.stringify({
        event: 'exam_created',
        exam_uuid: exam.exam_uuid,
        label: exam.exam_label,
        students_added: students?.length || 0,
      }),
    );

    return exam;
  }

  async update(id: string, updateExamDto: UpdateExamDto) {
    const currentExam = await this.findOne(id);
    if (!currentExam) {
      throw new NotFoundException(`Examen avec l'ID ${id} non trouvé`);
    }

    const { ...examData } = updateExamDto;

    const exam = await this.prisma.$transaction(async (tx) => {
      // Mettre à jour l'examen
      const updatedExam = await tx.exam.update({
        where: { exam_uuid: id },
        data: {
          exam_label: examData.exam_label,
          exam_taked_at: examData.exam_taked_at
            ? new Date(examData.exam_taked_at)
            : undefined,
          exam_type: examData.exam_type,
        },
        include: {
          students: {
            include: {
              student: true,
            },
          },
        },
      });

      // Historique désactivé

      return updatedExam;
    });

    this.logger.log(
      JSON.stringify({
        event: 'exam_updated',
        exam_uuid: exam.exam_uuid,
        label: exam.exam_label,
      }),
    );

    return exam;
  }

  async delete(id: string) {
    const exam = await this.findOne(id);
    if (!exam) {
      throw new NotFoundException(`Examen avec l'ID ${id} non trouvé`);
    }

    const deletedExam = await this.prisma.$transaction(async (tx) => {
      // Historique désactivé

      // Supprimer d'abord tous les StudentExam liés
      await tx.studentExam.deleteMany({
        where: { exam_uuid: id },
      });

      // Puis supprimer l'examen
      return tx.exam.delete({
        where: { exam_uuid: id },
        include: {
          students: {
            include: {
              student: true,
            },
          },
        },
      });
    });

    this.logger.log(
      JSON.stringify({
        event: 'exam_deleted',
        exam_uuid: deletedExam.exam_uuid,
        label: deletedExam.exam_label,
      }),
    );

    return deletedExam;
  }

  // Méthodes pour gérer les StudentExam
  async addStudentToExam(createStudentExamDto: CreateStudentExamDto) {
    const studentExam = await this.prisma.studentExam.create({
      data: {
        student_uuid: createStudentExamDto.student_uuid,
        exam_uuid: createStudentExamDto.exam_uuid,
        exam_score: createStudentExamDto.exam_score,
        exam_status: createStudentExamDto.exam_status || 'pending',
        exam_notes: createStudentExamDto.exam_notes,
      },
      include: {
        student: true,
        exam: true,
      },
    });

    // Historique désactivé
    this.logger.log(
      JSON.stringify({
        event: 'exam_student_added',
        exam_uuid: studentExam.exam_uuid,
        student_uuid: studentExam.student_uuid,
      }),
    );
    return studentExam;
  }

  async updateStudentExam(
    studentUuid: string,
    examUuid: string,
    updateStudentExamDto: UpdateStudentExamDto,
  ) {
    const currentStudentExam = await this.prisma.studentExam.findUnique({
      where: {
        student_uuid_exam_uuid: {
          student_uuid: studentUuid,
          exam_uuid: examUuid,
        },
      },
      include: {
        student: true,
        exam: true,
      },
    });

    if (!currentStudentExam) {
      throw new NotFoundException(`Participation à l'examen non trouvée`);
    }

    const studentExam = await this.prisma.studentExam.update({
      where: {
        student_uuid_exam_uuid: {
          student_uuid: studentUuid,
          exam_uuid: examUuid,
        },
      },
      data: {
        exam_score: updateStudentExamDto.exam_score,
        exam_status: updateStudentExamDto.exam_status,
        exam_notes: updateStudentExamDto.exam_notes,
      },
      include: {
        student: true,
        exam: true,
      },
    });

    // Historique désactivé
    this.logger.log(
      JSON.stringify({
        event: 'exam_student_updated',
        exam_uuid: studentExam.exam_uuid,
        student_uuid: studentExam.student_uuid,
      }),
    );
    return studentExam;
  }

  async removeStudentFromExam(studentUuid: string, examUuid: string) {
    const studentExam = await this.prisma.studentExam.findUnique({
      where: {
        student_uuid_exam_uuid: {
          student_uuid: studentUuid,
          exam_uuid: examUuid,
        },
      },
      include: {
        student: true,
        exam: true,
      },
    });

    if (!studentExam) {
      throw new NotFoundException(`Participation à l'examen non trouvée`);
    }

    const deletedStudentExam = await this.prisma.studentExam.delete({
      where: {
        student_uuid_exam_uuid: {
          student_uuid: studentUuid,
          exam_uuid: examUuid,
        },
      },
      include: {
        student: true,
        exam: true,
      },
    });

    // Historique désactivé
    this.logger.log(
      JSON.stringify({
        event: 'exam_student_removed',
        exam_uuid: deletedStudentExam.exam_uuid,
        student_uuid: deletedStudentExam.student_uuid,
      }),
    );
    return deletedStudentExam;
  }

  async getStudentsByExam(examUuid: string, page?: string, pageSize?: string) {
    const take = Math.max(1, Number(pageSize) || 10);
    const currentPage = Math.max(1, Number(page) || 1);
    const skip = (currentPage - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.studentExam.findMany({
        where: { exam_uuid: examUuid },
        include: { student: true, exam: true },
        skip,
        take,
        orderBy: { taken_at: 'desc' },
      }),
      this.prisma.studentExam.count({ where: { exam_uuid: examUuid } }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page: currentPage,
        pageSize: take,
        totalPages: Math.max(1, Math.ceil(total / take)),
      },
    };
  }

  async getExamsByStudent(studentUuid: string) {
    return this.prisma.studentExam.findMany({
      where: { student_uuid: studentUuid },
      include: {
        student: true,
        exam: true,
      },
    });
  }

  // Nouvelle méthode pour ajouter tous les étudiants d'un groupe à un examen
  async addGroupToExam(
    groupUuid: string,
    examUuid: string,
    defaultScore?: string,
    defaultStatus?: string,
  ) {
    // Vérifier que l'examen existe
    const exam = await this.prisma.exam.findUnique({
      where: { exam_uuid: examUuid },
    });
    if (!exam) {
      throw new NotFoundException(`Examen avec l'ID ${examUuid} non trouvé`);
    }

    // Vérifier que le groupe existe
    const group = await this.prisma.group.findUnique({
      where: { group_uuid: groupUuid },
      include: {
        students: {
          include: {
            student: true,
          },
        },
      },
    });
    if (!group) {
      throw new NotFoundException(`Groupe avec l'ID ${groupUuid} non trouvé`);
    }

    // Récupérer tous les étudiants du groupe
    const studentsInGroup = group.students.map((sg) => sg.student);

    if (studentsInGroup.length === 0) {
      throw new NotFoundException(
        `Aucun étudiant trouvé dans le groupe ${group.group_label}`,
      );
    }

    const addedStudentExams = await this.prisma.$transaction(async (tx) => {
      type StudentExamWithRelations = StudentExam & {
        student: Student;
        exam: Exam;
      };
      const results: StudentExamWithRelations[] = [];

      for (const student of studentsInGroup) {
        // Vérifier si l'étudiant n'est pas déjà dans l'examen
        const existingStudentExam = await tx.studentExam.findUnique({
          where: {
            student_uuid_exam_uuid: {
              student_uuid: student.student_uuid,
              exam_uuid: examUuid,
            },
          },
        });

        if (!existingStudentExam) {
          // Ajouter l'étudiant à l'examen
          const studentExam = await tx.studentExam.create({
            data: {
              student_uuid: student.student_uuid,
              exam_uuid: examUuid,
              exam_score: defaultScore,
              exam_status: defaultStatus || 'pending',
              exam_notes: `Ajouté via le groupe: ${group.group_label}`,
            },
            include: {
              student: true,
              exam: true,
            },
          });

          // Historique désactivé

          results.push(studentExam);
        }
      }

      return results;
    });

    const result = {
      message: `${addedStudentExams.length} étudiant(s) ajouté(s) à l'examen`,
      addedStudents: addedStudentExams.length,
      totalStudentsInGroup: studentsInGroup.length,
      exam: exam.exam_label,
      group: group.group_label,
      studentExams: addedStudentExams,
    };

    this.logger.log(
      JSON.stringify({
        event: 'exam_group_added',
        exam_uuid: examUuid,
        group_uuid: groupUuid,
        added: addedStudentExams.length,
        totalInGroup: studentsInGroup.length,
      }),
    );

    return result;
  }
}
