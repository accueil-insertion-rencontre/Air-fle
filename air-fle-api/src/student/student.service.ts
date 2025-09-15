import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { StudentRepository } from './student.repository';

import { Student } from '@prisma/client';

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(
    private readonly studentRepository: StudentRepository,
    // learner history removed
  ) {}

  async create(
    data: any,
    createdByUserId?: string,
  ): Promise<Student> {
    try {
      this.validateStudentData(data);

      const prismaData = this.transformDtoToPrismaCreateInput(data);

      // Créer l'étudiant d'abord
      const student = await this.studentRepository.create(
        prismaData as any,
        this.studentRepository.getStandardIncludes(),
      );

      // Assigner la nationalité si fournie
      if (data.nationality_uuid) {
        await this.studentRepository.updateStudentNationalities(
          student.student_uuid,
          [data.nationality_uuid],
        );

        // Récupérer l'étudiant avec les nationalités mises à jour
        const studentWithNationalities =
          await this.studentRepository.findUnique({
            where: { student_uuid: student.student_uuid },
            include: this.studentRepository.getStandardIncludes(),
          });

        if (studentWithNationalities) {
          this.recordStudentCreation(studentWithNationalities, createdByUserId);

          this.logger.log(
            JSON.stringify({
              event: 'student_created',
              uuid: studentWithNationalities.student_uuid,
              email: studentWithNationalities.student_mail ?? null,
              createdBy: createdByUserId ?? 'system',
              timestamp: new Date().toISOString(),
            }),
          );

          return studentWithNationalities;
        }
      }

      // Historique désactivé

      this.logger.log(
        JSON.stringify({
          event: 'student_created',
          uuid: student.student_uuid,
          email: student.student_mail ?? null,
          createdBy: createdByUserId ?? 'system',
          timestamp: new Date().toISOString(),
        }),
      );

      return student;
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          event: 'student_creation_failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          createdBy: createdByUserId ?? 'system',
          timestamp: new Date().toISOString(),
        }),
      );
      throw error;
    }
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Record<string, any>;
    orderBy?: Record<string, any>;
  }): Promise<Student[]> {
    try {
      const { skip, take, where, orderBy } = params || {};
      const students = await this.studentRepository.findMany({
        skip,
        take,
        where,
        orderBy,
        include: this.studentRepository.getListIncludes(), // ✅ Includes spécialisés pour liste
      });

      this.logger.log(
        JSON.stringify({
          event: 'students_listed',
          count: students.length,
          filters: where ? JSON.stringify(where) : 'none',
          timestamp: new Date().toISOString(),
        }),
      );

      return students;
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          event: 'students_list_failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        }),
      );
      throw error;
    }
  }

  async findOne(
    studentWhereUniqueInput: any,
  ): Promise<Student | null> {
    try {
      const student = await this.studentRepository.findUnique({
        where: studentWhereUniqueInput,
        include: this.studentRepository.getDetailIncludes(), // ✅ Includes spécialisés pour détail
      });

      if (student) {
        this.logger.log(
          JSON.stringify({
            event: 'student_retrieved',
            uuid: student.student_uuid,
            timestamp: new Date().toISOString(),
          }),
        );
      } else {
        this.logger.warn(
          JSON.stringify({
            event: 'student_not_found',
            search_criteria: JSON.stringify(studentWhereUniqueInput),
            timestamp: new Date().toISOString(),
          }),
        );
      }

      return student;
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          event: 'student_retrieval_failed',
          search_criteria: JSON.stringify(studentWhereUniqueInput),
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        }),
      );
      throw error;
    }
  }

  async update(
    params: {
      where: any;
      data: any;
    },
    updatedByUserId?: string,
  ): Promise<Student> {
    try {
      const { where, data } = params;

      // ✅ 1. Validation
      this.validateStudentData(data);

      // ✅ 2. Récupération état actuel
      const currentStudent = await this.studentRepository.findUnique({
        where,
        include: this.studentRepository.getStandardIncludes(),
      });

      if (!currentStudent) {
        this.logger.warn(
          JSON.stringify({
            event: 'student_update_not_found',
            search_criteria: JSON.stringify(where),
            timestamp: new Date().toISOString(),
          }),
        );
        throw new NotFoundException('Étudiant non trouvé');
      }

      // ✅ 3. Mise à jour
      const updatedStudent = await this.studentRepository.update({
        data,
        where,
        include: this.studentRepository.getStandardIncludes(),
      });

      // ✅ 4. Tracking des changements
      // Historique désactivé

      this.logger.log(
        JSON.stringify({
          event: 'student_updated',
          uuid: updatedStudent.student_uuid,
          updatedBy: updatedByUserId ?? 'system',
          timestamp: new Date().toISOString(),
        }),
      );

      return updatedStudent;
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          event: 'student_update_failed',
          search_criteria: JSON.stringify(params.where),
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          updatedBy: updatedByUserId ?? 'system',
          timestamp: new Date().toISOString(),
        }),
      );
      throw error;
    }
  }

  async count(where?: Record<string, any>): Promise<number> {
    try {
      const count = await this.studentRepository.count(where);

      this.logger.log(
        JSON.stringify({
          event: 'students_counted',
          count,
          filters: where ? JSON.stringify(where) : 'none',
          timestamp: new Date().toISOString(),
        }),
      );

      return count;
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          event: 'students_count_failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        }),
      );
      throw error;
    }
  }

  // ✅ Tracking des changements organisé
  private async trackStudentChanges(
    previous: any,
    updated: any,
    updateData: any,
    updatedByUserId?: string,
  ): Promise<void> {
    const changes: Promise<void>[] = [];

    // Changement de niveau
    if (
      updateData.french_level_uuid &&
      previous.french_level_uuid !== updated.french_level_uuid
    ) {
      changes.push(
        this.recordLevelChange(
          updated.student_uuid,
          previous.frenchLevel,
          updated.frenchLevel,
          updatedByUserId,
        ),
      );
    }

    // Changement de statut
    if (
      updateData.status_uuid &&
      previous.status_uuid !== updated.status_uuid
    ) {
      changes.push(
        this.recordStatusChange(
          updated.student_uuid,
          previous.status,
          updated.status,
          updatedByUserId,
        ),
      );
    }

    // Changements d'infos personnelles
    const personalChanges = this.detectPersonalInfoChanges(
      previous,
      updated,
      updateData,
    );
    if (personalChanges.length > 0) {
      changes.push(
        this.recordPersonalInfoChanges(
          updated.student_uuid,
          personalChanges,
          updatedByUserId,
        ),
      );
    }

    // Changement d'orientation
    if (
      updateData.orientation_uuid &&
      previous.orientation_uuid !== updated.orientation_uuid
    ) {
      changes.push(
        this.recordOrientationChange(
          updated.student_uuid,
          previous.orientation,
          updated.orientation,
          updatedByUserId,
        ),
      );
    }

    // Exécuter tous les changements en parallèle
    await Promise.all(changes);
  }

  private recordLevelChange(
    studentId: string,
    previousLevel: any,
    newLevel: any,
    updatedByUserId?: string,
  ): Promise<void> {
    // Historique supprimé - parameters kept for interface compatibility
    void studentId;
    void previousLevel;
    void newLevel;
    void updatedByUserId;
    return Promise.resolve();
  }

  private recordStatusChange(
    studentId: string,
    previousStatus: any,
    newStatus: any,
    updatedByUserId?: string,
  ): Promise<void> {
    // Historique supprimé - parameters kept for interface compatibility
    void studentId;
    void previousStatus;
    void newStatus;
    void updatedByUserId;
    return Promise.resolve();
  }

  private recordOrientationChange(
    studentId: string,
    previousOrientation: any,
    newOrientation: any,
    updatedByUserId?: string,
  ): Promise<void> {
    // Historique supprimé - parameters kept for interface compatibility
    void studentId;
    void previousOrientation;
    void newOrientation;
    void updatedByUserId;
    return Promise.resolve();
  }

  private detectPersonalInfoChanges(
    previous: any,
    updated: any,
    updateData: any,
  ): { field: string; from: any; to: any }[] {
    const changes: { field: string; from: any; to: any }[] = [];

    if (
      updateData.student_firstname &&
      previous.student_firstname !== updated.student_firstname
    ) {
      changes.push({
        field: 'firstname',
        from: previous.student_firstname,
        to: updated.student_firstname,
      });
    }

    if (
      updateData.student_lastname &&
      previous.student_lastname !== updated.student_lastname
    ) {
      changes.push({
        field: 'lastname',
        from: previous.student_lastname,
        to: updated.student_lastname,
      });
    }

    if (
      updateData.student_mail &&
      previous.student_mail !== updated.student_mail
    ) {
      changes.push({
        field: 'email',
        from: previous.student_mail,
        to: updated.student_mail,
      });
    }

    if (
      updateData.student_phone &&
      previous.student_phone !== updated.student_phone
    ) {
      changes.push({
        field: 'phone',
        from: previous.student_phone,
        to: updated.student_phone,
      });
    }

    return changes;
  }

  private recordPersonalInfoChanges(
    studentId: string,
    changes: { field: string; from: any; to: any }[],
    updatedByUserId?: string,
  ): Promise<void> {
    // Historique supprimé - parameters kept for interface compatibility
    void studentId;
    void changes;
    void updatedByUserId;
    return Promise.resolve();
  }

  async remove(
    where: any,
    deletedByUserId?: string,
  ): Promise<Student> {
    const student = await this.findOne(where);
    if (!student) {
      throw new NotFoundException('Étudiant non trouvé');
    }

    // ✅ Historique délégué
    // Historique désactivé

    this.logger.log(
      JSON.stringify({
        event: 'student_deleted',
        uuid: student.student_uuid,
        email: student.student_mail ?? null,
        deletedBy: deletedByUserId ?? 'system',
        timestamp: new Date().toISOString(),
      }),
    );

    return this.studentRepository.delete(where);
  }

  async updateStudentDisabilities(
    studentId: string,
    disabilityIds: string[],
    updatedByUserId?: string,
  ): Promise<void> {
    try {
      // Récupérer les handicaps actuels (désactivé)
      // const _currentDisabilities =
      //   await this.studentRepository.findStudentDisabilities(studentId);

      // ✅ Mise à jour via repository
      await this.studentRepository.updateStudentDisabilities(
        studentId,
        disabilityIds,
      );

      // ✅ Historique délégué
      // Historique désactivé

      this.logger.log(
        JSON.stringify({
          event: 'student_disabilities_updated',
          student_uuid: studentId,
          disabilities_count: disabilityIds.length,
          updatedBy: updatedByUserId ?? 'system',
          timestamp: new Date().toISOString(),
        }),
      );
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          event: 'student_disabilities_update_failed',
          student_uuid: studentId,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          updatedBy: updatedByUserId ?? 'system',
          timestamp: new Date().toISOString(),
        }),
      );
      throw error;
    }
  }

  // ===============================
  // ✅ MÉTHODES PRIVÉES ORGANISÉES
  // ===============================

  // ✅ Validation métier centralisée
  private validateStudentData(data: any): void {
    if (data.student_birthdate) {
      const age = this.calculateAge(new Date(data.student_birthdate as string | number | Date));
      if (age < 16) {
        throw new BadRequestException("L'étudiant doit avoir au moins 16 ans");
      }
      if (age > 100) {
        throw new BadRequestException('Âge invalide');
      }
    }

    if (data.student_mail && !this.isValidEmail(data.student_mail as string)) {
      throw new BadRequestException('Format email invalide');
    }
  }

  // ✅ Enregistrement historique spécialisé
  private recordStudentCreation(
    student: Student,
    createdByUserId?: string,
  ): void {
    // Historique supprimé - parameters kept for interface compatibility
    void student;
    void createdByUserId;
    return;
  }

  private recordStudentDeletion(
    student: Student,
    deletedByUserId?: string,
  ): void {
    // Historique supprimé - parameters kept for interface compatibility
    void student;
    void deletedByUserId;
    return;
  }

  private recordDisabilityChange(
    studentId: string,
    previousDisabilities: any[],
    newDisabilityIds: string[],
    updatedByUserId?: string,
  ): void {
    // Historique supprimé - parameters kept for interface compatibility
    void studentId;
    void previousDisabilities;
    void newDisabilityIds;
    void updatedByUserId;
    return;
  }

  // ✅ Utilitaires
  private calculateAge(birthdate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const monthDiff = today.getMonth() - birthdate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthdate.getDate())
    ) {
      age--;
    }

    return age;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private extractStudentBasicData(student: Student) {
    return {
      firstname: student.student_firstname,
      lastname: student.student_lastname,
      birthdate: student.student_birthdate,
      email: student.student_mail,
      phone: student.student_phone,
    };
  }

  // ✅ Nouvelle méthode pour transformer le DTO en format Prisma
  private transformDtoToPrismaCreateInput(
    data: any,
  ): any {
    const prismaData: any = {
      // Champs directs
      student_firstname: data.student_firstname,
      student_lastname: data.student_lastname,
      student_birthdate: data.student_birthdate,
      student_place_of_birth: data.student_place_of_birth,
      student_mail: data.student_mail,
      student_phone: data.student_phone,
      student_date_test_initial: data.student_date_test_initial,
      student_date_entry_france: data.student_date_entry_france,
      student_commentary: data.student_commentary,
      student_created_at: data.student_created_at || new Date(),
      student_updated_at: data.student_updated_at || new Date(),
      student_date_cir: data.student_date_cir,
      student_date_residence_permit: data.student_date_residence_permit,

      // Relations obligatoires
      gender: { connect: { gender_uuid: data.gender_uuid } },
      frenchLevel: { connect: { french_level_uuid: data.french_level_uuid } },
      financing: { connect: { financing_uuid: data.financing_uuid } },
      status: { connect: { status_uuid: data.status_uuid } },
    };

    // Relations optionnelles
    if (data.orientation_uuid) {
      prismaData.orientation = {
        connect: { orientation_uuid: data.orientation_uuid },
      };
    }

    if (data.exit_reason_uuid) {
      prismaData.exitReason = {
        connect: { exit_reason_uuid: data.exit_reason_uuid },
      };
    }

    return prismaData;
  }
}
