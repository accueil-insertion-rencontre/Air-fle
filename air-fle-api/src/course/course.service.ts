import {
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { AttendancePostBody, NewAttendanceStatus } from './dto/attendance.dto';

// Type pour un cours avec ses relations
type CourseWithRelations = Prisma.CourseGetPayload<{
  include: {
    group: true;
    teachers: {
      include: {
        user: true;
      };
    };
    absences: true;
  };
}>;

// Type pour un cours avec session incluse
type CourseWithSession = Prisma.CourseGetPayload<{
  include: {
    group: {
      include: {
        session: true;
      };
    };
    teachers: {
      include: {
        user: true;
      };
    };
    absences: true;
  };
}>;

@Injectable()
export class CourseService {
  private readonly logger = new Logger(CourseService.name);
  constructor(private prisma: PrismaService) {}

  async create(
    courseData: Prisma.CourseCreateInput,
  ): Promise<CourseWithRelations> {
    const course = await this.prisma.course.create({
      data: courseData,
      include: {
        group: true,
        teachers: {
          include: {
            user: true,
          },
        },
        absences: true,
      },
    });

    this.logger.log(
      JSON.stringify({
        event: 'course_created',
        course_uuid: course.course_uuid,
        course_name: course.course_name,
        group_uuid: courseData.group?.connect
          ? (courseData.group.connect as { group_uuid?: string }).group_uuid
          : undefined,
      }),
    );

    return course;
  }

  // ✅ Méthode spécialisée pour récupérer cours AVEC session
  async findAllWithSession(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.CourseWhereInput;
    orderBy?: Prisma.CourseOrderByWithRelationInput;
  }): Promise<{
    data: CourseWithSession[];
    meta: {
      total: number;
      skip: number;
      take: number;
      page?: number;
      pageSize?: number;
      totalPages?: number;
    };
  }> {
    const { skip, take, where, orderBy } = params || {};

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          group: {
            include: {
              session: true, // ✅ Session incluse quand nécessaire
            },
          },
          teachers: {
            include: {
              user: true,
            },
          },
          absences: true,
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    const meta: {
      data: CourseWithSession[];
      meta: {
        total: number;
        skip: number;
        take: number;
        page?: number;
        pageSize?: number;
        totalPages?: number;
      };
    } = {
      data: courses,
      meta: {
        total,
        skip: skip || 0,
        take: take || total,
      },
    };
    if (typeof skip === 'number' && typeof take === 'number' && take > 0) {
      meta.meta.page = Math.floor((skip || 0) / take) + 1;
      meta.meta.pageSize = take;
      meta.meta.totalPages = Math.ceil(total / take);
    }
    return meta;
  }

  async addTeacher(
    courseId: string,
    userId: string,
  ): Promise<Prisma.UserCourseGetPayload<Record<string, never>>> {
    return this.prisma.userCourse.create({
      data: {
        user_uuid: userId,
        course_uuid: courseId,
      },
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.CourseWhereInput;
    orderBy?: Prisma.CourseOrderByWithRelationInput;
  }): Promise<{
    data: CourseWithRelations[];
    meta: {
      total: number;
      skip: number;
      take: number;
      page?: number;
      pageSize?: number;
      totalPages?: number;
    };
  }> {
    const { skip, take, where, orderBy } = params || {};

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          group: true,
          teachers: {
            include: {
              user: true,
            },
          },
          absences: true,
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    const meta: {
      data: CourseWithRelations[];
      meta: {
        total: number;
        skip: number;
        take: number;
        page?: number;
        pageSize?: number;
        totalPages?: number;
      };
    } = {
      data: courses,
      meta: {
        total,
        skip: skip || 0,
        take: take || total,
      },
    };
    if (typeof skip === 'number' && typeof take === 'number' && take > 0) {
      meta.meta.page = Math.floor((skip || 0) / take) + 1;
      meta.meta.pageSize = take;
      meta.meta.totalPages = Math.ceil(total / take);
    }
    return meta;
  }

  async findOne(courseId: string): Promise<CourseWithRelations | null> {
    return this.prisma.course.findUnique({
      where: { course_uuid: courseId },
      include: {
        group: true,
        teachers: {
          include: {
            user: true,
          },
        },
        absences: true,
      },
    });
  }

  async update(
    courseId: string,
    updateData: Prisma.CourseUpdateInput,
  ): Promise<CourseWithRelations> {
    const course = await this.prisma.course.update({
      where: { course_uuid: courseId },
      data: updateData,
      include: {
        group: true,
        teachers: {
          include: {
            user: true,
          },
        },
        absences: true,
      },
    });
    this.logger.log(
      JSON.stringify({
        event: 'course_updated',
        course_uuid: course.course_uuid,
        course_name: course.course_name,
      }),
    );
    return course;
  }

  async removeAllTeachers(courseId: string): Promise<void> {
    await this.prisma.userCourse.deleteMany({
      where: { course_uuid: courseId },
    });
  }

  async addTeacherToCourse(
    courseId: string,
    userId: string,
  ): Promise<Prisma.UserCourseGetPayload<Record<string, never>>> {
    return this.prisma.userCourse.create({
      data: {
        user_uuid: userId,
        course_uuid: courseId,
      },
    });
  }

  async delete(courseId: string): Promise<CourseWithRelations> {
    // 1) Supprimer d'abord les absences liées au cours (évite la contrainte FK)
    await this.prisma.absence.deleteMany({
      where: { course_uuid: courseId },
    });

    // 2) Supprimer ensuite les relations avec les enseignants
    await this.prisma.userCourse.deleteMany({
      where: { course_uuid: courseId },
    });

    // 3) Puis supprimer le cours
    const course = await this.prisma.course.delete({
      where: { course_uuid: courseId },
      include: {
        group: true,
        teachers: {
          include: {
            user: true,
          },
        },
        absences: true,
      },
    });
    this.logger.log(
      JSON.stringify({
        event: 'course_deleted',
        course_uuid: course.course_uuid,
        course_name: course.course_name,
      }),
    );
    return course;
  }

  // ===== Attendance endpoints logic =====
  private mapStatusToAbsenceFields(status: NewAttendanceStatus): {
    absence_status: string;
    absence_reason?: string | null;
  } {
    switch (status) {
      case 'absent':
        return { absence_status: 'absent' };
      case 'justified':
        return { absence_status: 'absent', absence_reason: 'justified' };
      case 'late':
        return { absence_status: 'late' };
      case 'present':
      default:
        // pas d'entrée Absence pour "present"
        return { absence_status: 'present', absence_reason: null };
    }
  }

  async getCourseAttendance(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { course_uuid: courseId },
      include: {
        group: {
          include: {
            students: {
              include: {
                student: true,
              },
            },
          },
        },
        absences: true,
        attendance_taken_by: true,
      },
    });
    if (!course) {
      throw new NotFoundException('Cours introuvable');
    }

    // Liste des étudiants du groupe
    const students = (course.group?.students || []).map((sg) => sg.student);

    // Indexer les absences par student_uuid
    const absenceByStudent: Record<
      string,
      {
        absence_status: string;
        absence_notes: string | null;
        absence_reason: string | null;
      }
    > = {};
    for (const a of course.absences) {
      absenceByStudent[a.student_uuid] = {
        absence_status: a.absence_status,
        absence_notes: a.absence_notes ?? null,
        absence_reason: a.absence_reason ?? null,
      };
    }

    const response: {
      course_uuid: string;
      attendance_taken: boolean;
      attendance_taken_at: string | undefined;
      attendance_taken_by: {
        user_uuid: string;
        user_firstname: string;
        user_lastname: string;
      } | null;
      students: {
        student_uuid: string;
        firstname: string;
        lastname: string;
        status: NewAttendanceStatus;
        notes: string | null;
      }[];
      summary: {
        present: number;
        absent: number;
        justified: number;
        late: number;
      };
    } = {
      course_uuid: course.course_uuid,
      attendance_taken: course.attendance_taken,
      attendance_taken_at: course.attendance_taken_at?.toISOString(),
      attendance_taken_by: course.attendance_taken_by
        ? {
            user_uuid: course.attendance_taken_by.user_uuid,
            user_firstname: course.attendance_taken_by.user_firstname,
            user_lastname: course.attendance_taken_by.user_lastname,
          }
        : null,
      students: students.map((s) => {
        const absence = absenceByStudent[s.student_uuid];
        let status: NewAttendanceStatus = 'present';
        if (absence) {
          if (absence.absence_status === 'late') status = 'late';
          else if (
            absence.absence_status === 'absent' &&
            absence.absence_reason === 'justified'
          )
            status = 'justified';
          else if (absence.absence_status === 'absent') status = 'absent';
          else status = 'present';
        }
        return {
          student_uuid: s.student_uuid,
          firstname: s.student_firstname,
          lastname: s.student_lastname,
          status,
          notes: absence?.absence_notes ?? null,
        };
      }),
      summary: { present: 0, absent: 0, justified: 0, late: 0 },
    };

    // Calcul du résumé
    const summary = { present: 0, absent: 0, justified: 0, late: 0 };
    for (const st of response.students) {
      switch (st.status) {
        case 'present':
          summary.present += 1;
          break;
        case 'late':
          summary.late += 1;
          break;
        case 'justified':
          summary.justified += 1;
          break;
        case 'absent':
          summary.absent += 1;
          break;
      }
    }
    response.summary = summary;

    return response;
  }

  async submitCourseAttendance(
    courseId: string,
    body: AttendancePostBody,
    takenByUserUuid: string,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { course_uuid: courseId },
      include: { group: { include: { students: true } }, absences: true },
    });
    if (!course) {
      throw new NotFoundException('Cours introuvable');
    }
    if (course.attendance_taken) {
      throw new ConflictException("L'appel a déjà été validé pour ce cours");
    }

    // Vérif cohérence: chaque étudiant soumis doit appartenir au groupe du cours
    const groupStudentIds = new Set(
      (course.group?.students || []).map((gs) => gs.student_uuid),
    );
    for (const s of body.students) {
      if (!groupStudentIds.has(s.student_uuid)) {
        throw new ConflictException(
          "Un étudiant soumis n'appartient pas au groupe de ce cours",
        );
      }
    }

    // Transaction: créer/mettre à jour absences + marquer cours pris
    const now = new Date();
    const created = await this.prisma.$transaction(async (tx) => {
      // Nettoyer absences existantes pour ce cours (sécurité si données legacy)
      await tx.absence.deleteMany({ where: { course_uuid: courseId } });

      // Créer nouvelles entrées uniquement pour les non-présents
      for (const s of body.students) {
        if (s.status === 'present') continue;
        const fields = this.mapStatusToAbsenceFields(s.status);
        await tx.absence.create({
          data: {
            course: { connect: { course_uuid: courseId } },
            student: { connect: { student_uuid: s.student_uuid } },
            absence_status: fields.absence_status,
            absence_reason: fields.absence_reason ?? undefined,
            absence_notes: s.notes ?? undefined,
          },
        });
      }

      const updatedCourse = await tx.course.update({
        where: { course_uuid: courseId },
        data: {
          attendance_taken: true,
          attendance_taken_at: now,
          attendance_taken_by: takenByUserUuid
            ? { connect: { user_uuid: takenByUserUuid } }
            : undefined,
        },
      });

      return updatedCourse;
    });

    // Construire résumé
    const summary = { present: 0, absent: 0, justified: 0, late: 0 };
    for (const s of body.students) {
      switch (s.status) {
        case 'present':
          summary.present += 1;
          break;
        case 'late':
          summary.late += 1;
          break;
        case 'justified':
          summary.justified += 1;
          break;
        case 'absent':
          summary.absent += 1;
          break;
      }
    }

    return {
      course_uuid: created.course_uuid,
      attendance_taken: true,
      attendance_taken_at: now.toISOString(),
      attendance_taken_by: undefined,
      summary,
    };
  }
}
