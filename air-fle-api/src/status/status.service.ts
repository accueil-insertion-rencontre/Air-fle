import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Status } from '@prisma/client';

@Injectable()
export class StatusService {
  private readonly logger = new Logger(StatusService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Status[]> {
    return this.prisma.status.findMany();
  }

  async findOne(id: string): Promise<Status | null> {
    return this.prisma.status.findUnique({
      where: { status_uuid: id },
    });
  }

  async create(createStatusData: Prisma.StatusCreateInput): Promise<Status> {
    const status = await this.prisma.status.create({
      data: createStatusData,
    });
    this.logger.log(
      JSON.stringify({
        event: 'status_created',
        status_uuid: status.status_uuid,
        label: status.status_label,
      }),
    );
    return status;
  }

  async update(
    id: string,
    updateStatusData: Prisma.StatusUpdateInput,
  ): Promise<Status> {
    const status = await this.prisma.status.update({
      where: { status_uuid: id },
      data: updateStatusData,
    });
    this.logger.log(
      JSON.stringify({
        event: 'status_updated',
        status_uuid: status.status_uuid,
      }),
    );
    return status;
  }

  async delete(id: string): Promise<Status> {
    // Vérifier d'abord si le statut existe et ses dépendances
    const status = await this.prisma.status.findUnique({
      where: { status_uuid: id },
      include: {
        students: {
          select: { student_uuid: true },
        },
      },
    });

    if (!status) {
      throw new NotFoundException('Statut non trouvé');
    }

    // Vérifier s'il est utilisé par des étudiants
    if (status.students && status.students.length > 0) {
      throw new BadRequestException(
        `Ce statut ne peut pas être supprimé car il est attribué à ${status.students.length} étudiant(s)`,
      );
    }

    // Si tout est OK, supprimer le statut
    const deletedStatus = await this.prisma.status.delete({
      where: { status_uuid: id },
    });

    this.logger.log(
      JSON.stringify({
        event: 'status_deleted',
        status_uuid: deletedStatus.status_uuid,
      }),
    );
    return deletedStatus;
  }
}
