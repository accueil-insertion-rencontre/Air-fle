import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AbsenceService {
  private readonly logger = new Logger(AbsenceService.name);
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.AbsenceCreateInput, createdByUserId?: string) {
    try {
      const absence = await this.prisma.absence.create({
        data,
        include: {
          student: true,
          course: true,
        },
      });

      // Historique désactivé
      this.logger.log(
        JSON.stringify({
          event: 'absence_created',
          absence_uuid: absence.absence_uuid,
          student_uuid: absence.student_uuid,
          course_uuid: absence.course_uuid,
          createdBy: createdByUserId ?? 'system',
        }),
      );
      return absence;
    } catch (error) {
      if (error.code === 'P2002') {
        // Erreur de contrainte unique
        throw new ConflictException(
          "Une absence existe déjà pour cet étudiant et ce cours. Un étudiant ne peut avoir qu'une seule absence par cours.",
        );
      }
      this.logger.error(
        JSON.stringify({
          event: 'absence_create_failed',
          error: error?.message,
          stack: error?.stack,
        }),
      );
      throw error;
    }
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.AbsenceWhereInput;
    orderBy?: Prisma.AbsenceOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    const [absences, total] = await Promise.all([
      this.prisma.absence.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          student: true,
          course: true,
        },
      }),
      this.prisma.absence.count({ where }),
    ]);

    return {
      data: absences,
      meta: {
        total,
        skip: skip || 0,
        take: take || total,
      },
    };
  }

  async findOne(id: string) {
    const absence = await this.prisma.absence.findUnique({
      where: { absence_uuid: id },
      include: {
        student: true,
        course: true,
      },
    });

    if (!absence) {
      throw new NotFoundException(`Absence with ID ${id} not found`);
    }

    return absence;
  }

  async checkExistingAbsence(studentUuid: string, courseUuid: string) {
    const existingAbsence = await this.prisma.absence.findFirst({
      where: {
        student_uuid: studentUuid,
        course_uuid: courseUuid,
      },
      include: {
        student: true,
        course: true,
      },
    });

    return existingAbsence;
  }

  async update(
    id: string,
    data: Prisma.AbsenceUpdateInput,
    updatedByUserId?: string,
  ) {
    // Récupérer l'absence actuelle
    const currentAbsence = await this.findOne(id);

    try {
      const updatedAbsence = await this.prisma.absence.update({
        where: { absence_uuid: id },
        data,
        include: {
          student: true,
          course: true,
        },
      });

      // Historique désactivé
      this.logger.log(
        JSON.stringify({
          event: 'absence_updated',
          absence_uuid: updatedAbsence.absence_uuid,
          student_uuid: updatedAbsence.student_uuid,
          course_uuid: updatedAbsence.course_uuid,
          updatedBy: updatedByUserId ?? 'system',
        }),
      );
      return updatedAbsence;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Absence with ID ${id} not found`);
      }
      this.logger.error(
        JSON.stringify({
          event: 'absence_update_failed',
          absence_uuid: id,
          error: error?.message,
          stack: error?.stack,
        }),
      );
      throw error;
    }
  }

  async remove(id: string, deletedByUserId?: string) {
    // Récupérer l'absence avant suppression
    const absence = await this.findOne(id);

    try {
      const deletedAbsence = await this.prisma.absence.delete({
        where: { absence_uuid: id },
      });

      // Historique désactivé
      this.logger.log(
        JSON.stringify({
          event: 'absence_deleted',
          absence_uuid: deletedAbsence.absence_uuid,
          student_uuid: deletedAbsence.student_uuid,
          course_uuid: absence.course_uuid,
          deletedBy: deletedByUserId ?? 'system',
        }),
      );
      return deletedAbsence;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Absence with ID ${id} not found`);
      }
      this.logger.error(
        JSON.stringify({
          event: 'absence_delete_failed',
          absence_uuid: id,
          error: error?.message,
          stack: error?.stack,
        }),
      );
      throw error;
    }
  }
}
