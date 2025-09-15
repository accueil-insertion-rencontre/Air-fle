import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Gender } from '@prisma/client';

@Injectable()
export class GenderService {
  private readonly logger = new Logger(GenderService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Gender[]> {
    return this.prisma.gender.findMany();
  }

  async findOne(id: string): Promise<Gender | null> {
    return this.prisma.gender.findUnique({
      where: { gender_uuid: id },
    });
  }

  async create(createGenderData: Prisma.GenderCreateInput): Promise<Gender> {
    const gender = await this.prisma.gender.create({
      data: createGenderData,
    });
    this.logger.log(
      JSON.stringify({
        event: 'gender_created',
        gender_uuid: gender.gender_uuid,
        label: gender.gender_label,
      }),
    );
    return gender;
  }

  async update(
    id: string,
    updateGenderData: Prisma.GenderUpdateInput,
  ): Promise<Gender> {
    const gender = await this.prisma.gender.update({
      where: { gender_uuid: id },
      data: updateGenderData,
    });
    this.logger.log(
      JSON.stringify({
        event: 'gender_updated',
        gender_uuid: gender.gender_uuid,
      }),
    );
    return gender;
  }

  async delete(id: string): Promise<Gender> {
    const gender = await this.prisma.gender.delete({
      where: { gender_uuid: id },
    });
    this.logger.log(
      JSON.stringify({
        event: 'gender_deleted',
        gender_uuid: gender.gender_uuid,
      }),
    );
    return gender;
  }
}
