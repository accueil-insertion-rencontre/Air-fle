import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Nationality } from '@prisma/client';

@Injectable()
export class NationalityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.NationalityWhereInput;
    orderBy?: Prisma.NationalityOrderByWithRelationInput;
  }): Promise<Nationality[]> {
    const { skip, take, where, orderBy } = params || {};
    return this.prisma.nationality.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }

  async findUnique(params: {
    where: Prisma.NationalityWhereUniqueInput;
  }): Promise<Nationality | null> {
    const { where } = params;
    return this.prisma.nationality.findUnique({
      where,
    });
  }

  async create(data: Prisma.NationalityCreateInput): Promise<Nationality> {
    return this.prisma.nationality.create({
      data,
    });
  }

  async update(params: {
    where: Prisma.NationalityWhereUniqueInput;
    data: Prisma.NationalityUpdateInput;
  }): Promise<Nationality> {
    const { where, data } = params;
    return this.prisma.nationality.update({
      where,
      data,
    });
  }

  async delete(
    where: Prisma.NationalityWhereUniqueInput,
  ): Promise<Nationality> {
    return this.prisma.nationality.delete({
      where,
    });
  }

  async count(where?: Prisma.NationalityWhereInput): Promise<number> {
    return this.prisma.nationality.count({
      where,
    });
  }

  async findByLabel(label: string): Promise<Nationality | null> {
    return this.prisma.nationality.findFirst({
      where: {
        nationality_label: {
          equals: label,
          mode: 'insensitive',
        },
      },
    });
  }
}
