import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IGroupStudentManager } from '../interfaces/group.interface';

@Injectable()
export class GroupStudentManagerService implements IGroupStudentManager {
  constructor(private readonly prisma: PrismaService) {}

  async addStudent(groupId: string, studentId: string): Promise<any> {
    return this.prisma.studentGroup.create({
      data: {
        group_uuid: groupId,
        student_uuid: studentId,
      },
      include: {
        group: true,
        student: {
          select: {
            student_uuid: true,
            student_firstname: true,
            student_lastname: true,
          },
        },
      },
    });
  }

  async removeStudent(groupId: string, studentId: string): Promise<any> {
    return this.prisma.studentGroup.delete({
      where: {
        student_uuid_group_uuid: {
          student_uuid: studentId,
          group_uuid: groupId,
        },
      },
    });
  }

  async getStudentsByGroup(groupId: string): Promise<any[]> {
    const result = await this.prisma.studentGroup.findMany({
      where: {
        group_uuid: groupId,
      },
      include: {
        student: {
          select: {
            student_uuid: true,
            student_firstname: true,
            student_lastname: true,
            student_birthdate: true,
          },
        },
      },
    });

    return result.map((item) => item.student);
  }
}
