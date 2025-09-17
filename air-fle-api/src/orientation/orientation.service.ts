import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
    // Vérifier d'abord si l'orientation existe et ses dépendances
    const orientation = await this.prisma.orientation.findUnique({
      where: { orientation_uuid: id },
      include: {
        students: {
          select: { student_uuid: true },
        },
      },
    });

    if (!orientation) {
      throw new NotFoundException('Orientation non trouvée');
    }

    // Vérifier s'il est utilisé par des étudiants
    if (orientation.students && orientation.students.length > 0) {
      throw new BadRequestException(
        `Cette orientation ne peut pas être supprimée car elle est attribuée à ${orientation.students.length} étudiant(s)`,
      );
    }

    // Si tout est OK, supprimer l'orientation
    const deletedOrientation = await this.prisma.orientation.delete({
      where: { orientation_uuid: id },
    });

    this.logger.log(
      JSON.stringify({
        event: 'orientation_deleted',
        orientation_uuid: deletedOrientation.orientation_uuid,
      }),
    );
    return deletedOrientation;
  }
}
