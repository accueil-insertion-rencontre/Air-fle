import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Orientation } from '@prisma/client';

@Injectable()
export class OrientationService {
  private readonly logger = new Logger(OrientationService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Orientation[]> {
    return this.prisma.orientation.findMany();
  }

  async findOne(id: string): Promise<Orientation | null> {
    return this.prisma.orientation.findUnique({
      where: { orientation_uuid: id },
    });
  }

  async create(
    createOrientationData: Prisma.OrientationCreateInput,
  ): Promise<Orientation> {
    const orientation = await this.prisma.orientation.create({
      data: createOrientationData,
    });
    this.logger.log(
      JSON.stringify({
        event: 'orientation_created',
        orientation_uuid: orientation.orientation_uuid,
        type: orientation.orientation_type,
      }),
    );
    return orientation;
  }

  async update(
    id: string,
    updateOrientationData: Prisma.OrientationUpdateInput,
  ): Promise<Orientation> {
    const orientation = await this.prisma.orientation.update({
      where: { orientation_uuid: id },
      data: updateOrientationData,
    });
    this.logger.log(
      JSON.stringify({
        event: 'orientation_updated',
        orientation_uuid: orientation.orientation_uuid,
      }),
    );
    return orientation;
  }

  async delete(id: string): Promise<Orientation> {
    const orientation = await this.prisma.orientation.delete({
      where: { orientation_uuid: id },
    });
    this.logger.log(
      JSON.stringify({
        event: 'orientation_deleted',
        orientation_uuid: orientation.orientation_uuid,
      }),
    );
    return orientation;
  }
}
