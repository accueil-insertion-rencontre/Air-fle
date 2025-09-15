import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

// Type pour un handicap avec ses relations
type DisabilityWithRelations = Prisma.DisabilityGetPayload<{
  include: {
    students: {
      include: {
        student: true;
      };
    };
  };
}>;

@Injectable()
export class DisabilityService {
  private readonly logger = new Logger(DisabilityService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<DisabilityWithRelations[]> {
    return this.prisma.disability.findMany({
      include: {
        students: {
          include: {
            student: true,
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<DisabilityWithRelations | null> {
    const disability = await this.prisma.disability.findUnique({
      where: { disability_uuid: id },
      include: {
        students: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!disability) {
      throw new NotFoundException(`Handicap avec l'ID ${id} non trouvé`);
    }

    return disability;
  }

  async create(
    data: Prisma.DisabilityCreateInput,
  ): Promise<DisabilityWithRelations> {
    const disability = await this.prisma.disability.create({
      data,
      include: {
        students: {
          include: {
            student: true,
          },
        },
      },
    });
    this.logger.log(
      JSON.stringify({
        event: 'disability_created',
        disability_uuid: disability.disability_uuid,
        label: disability.disability_label,
      }),
    );
    return disability;
  }

  async update(
    id: string,
    data: Prisma.DisabilityUpdateInput,
  ): Promise<DisabilityWithRelations> {
    try {
      const disability = await this.prisma.disability.update({
        where: { disability_uuid: id },
        data,
        include: {
          students: {
            include: {
              student: true,
            },
          },
        },
      });
      this.logger.log(
        JSON.stringify({
          event: 'disability_updated',
          disability_uuid: disability.disability_uuid,
        }),
      );
      return disability;
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        throw new NotFoundException(`Handicap avec l'ID ${id} non trouvé`);
      }
      throw error;
    }
  }

  async delete(id: string): Promise<DisabilityWithRelations> {
    try {
      const disability = await this.prisma.disability.delete({
        where: { disability_uuid: id },
        include: {
          students: {
            include: {
              student: true,
            },
          },
        },
      });
      this.logger.log(
        JSON.stringify({
          event: 'disability_deleted',
          disability_uuid: disability.disability_uuid,
        }),
      );
      return disability;
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        throw new NotFoundException(`Handicap avec l'ID ${id} non trouvé`);
      }
      throw error;
    }
  }
}
