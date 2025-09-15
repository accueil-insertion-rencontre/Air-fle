import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Group, Prisma } from '@prisma/client';
import {
  IGroupRepository,
  GroupWithRelations,
} from '../interfaces/group.interface';

@Injectable()
export class GroupRepository implements IGroupRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.GroupWhereInput;
  }): Promise<GroupWithRelations[]> {
    return this.prisma.group.findMany({
      ...params,
      include: {
        session: true,
        courses: true,
        students: {
          include: {
            student: true,
          },
        },
        periods: {
          include: {
            period: true,
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<GroupWithRelations | null> {
    return this.prisma.group.findUnique({
      where: { group_uuid: id },
      include: {
        session: true,
        courses: true,
        students: {
          include: {
            student: true,
          },
        },
        periods: {
          include: {
            period: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.GroupCreateInput): Promise<Group> {
    return this.prisma.group.create({
      data,
    });
  }

  async update(id: string, data: Prisma.GroupUpdateInput): Promise<Group> {
    return this.prisma.group.update({
      where: { group_uuid: id },
      data,
    });
  }

  async delete(id: string): Promise<Group> {
    return this.prisma.group.delete({
      where: { group_uuid: id },
    });
  }
}
