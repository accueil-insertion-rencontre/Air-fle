import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, FrenchLevel } from '@prisma/client';

@Injectable()
export class FrenchLevelRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.FrenchLevelWhereInput;
    orderBy?: Prisma.FrenchLevelOrderByWithRelationInput;
  }): Promise<FrenchLevel[]> {
    const { skip, take, where, orderBy } = params || {};
    return this.prisma.frenchLevel.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }

  async findUnique(params: {
    where: Prisma.FrenchLevelWhereUniqueInput;
  }): Promise<FrenchLevel | null> {
    const { where } = params;
    return this.prisma.frenchLevel.findUnique({
      where,
    });
  }

  async create(data: Prisma.FrenchLevelCreateInput): Promise<FrenchLevel> {
    return this.prisma.frenchLevel.create({
      data,
    });
  }

  async update(params: {
    where: Prisma.FrenchLevelWhereUniqueInput;
    data: Prisma.FrenchLevelUpdateInput;
  }): Promise<FrenchLevel> {
    const { where, data } = params;
    return this.prisma.frenchLevel.update({
      where,
      data,
    });
  }

  async delete(
    where: Prisma.FrenchLevelWhereUniqueInput,
  ): Promise<FrenchLevel> {
    return this.prisma.frenchLevel.delete({
      where,
    });
  }

  async findUniqueWithRelations(french_level_uuid: string): Promise<{
    french_level_uuid: string;
    french_level_code: string;
    french_level_description: string;
    students: { student_uuid: string }[];
    exit_students: { student_uuid: string }[];
  } | null> {
    return this.prisma.frenchLevel.findUnique({
      where: { french_level_uuid },
      include: {
        students: {
          select: { student_uuid: true },
        },
        exit_students: {
          select: { student_uuid: true },
        },
      },
    });
  }

  async findByCode(code: string): Promise<FrenchLevel | null> {
    return this.prisma.frenchLevel.findFirst({
      where: {
        french_level_code: {
          equals: code,
          mode: 'insensitive',
        },
      },
    });
  }

  async count(where?: Prisma.FrenchLevelWhereInput): Promise<number> {
    return this.prisma.frenchLevel.count({
      where,
    });
  }
}
