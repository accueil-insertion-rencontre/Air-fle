import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Financing } from '@prisma/client';

@Injectable()
export class FinancingService {
  private readonly logger = new Logger(FinancingService.name);
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async findAll(): Promise<Financing[]> {
    return this.prisma.financing.findMany();
  }

  async findOne(id: string): Promise<Financing> {
    const financing = await this.prisma.financing.findUnique({
      where: { financing_uuid: id },
    });

    if (!financing) {
      throw new NotFoundException(`Financement avec l'ID ${id} non trouvé`);
    }

    return financing;
  }

  async create(
    createFinancingData: Prisma.FinancingCreateInput,
  ): Promise<Financing> {
    const financing = await this.prisma.financing.create({
      data: createFinancingData,
    });
    this.logger.log(
      JSON.stringify({
        event: 'financing_created',
        financing_uuid: financing.financing_uuid,
        type: financing.financing_type,
      }),
    );
    return financing;
  }

  async update(
    id: string,
    updateFinancingData: Prisma.FinancingUpdateInput,
  ): Promise<Financing> {
    // Vérifier que le financement existe
    await this.findOne(id);

    const financing = await this.prisma.financing.update({
      where: { financing_uuid: id },
      data: updateFinancingData,
    });
    this.logger.log(
      JSON.stringify({
        event: 'financing_updated',
        financing_uuid: financing.financing_uuid,
      }),
    );
    return financing;
  }

  async delete(id: string): Promise<Financing> {
    // Vérifier d'abord si le financement existe et ses dépendances
    const financing = await this.prisma.financing.findUnique({
      where: { financing_uuid: id },
      include: {
        students: {
          select: { student_uuid: true },
        },
      },
    });

    if (!financing) {
      throw new NotFoundException('Financement non trouvé');
    }

    // Vérifier s'il est utilisé par des étudiants
    if (financing.students && financing.students.length > 0) {
      throw new BadRequestException(
        `Ce financement ne peut pas être supprimé car il est attribué à ${financing.students.length} étudiant(s)`,
      );
    }

    // Si tout est OK, supprimer le financement
    const deletedFinancing = await this.prisma.financing.delete({
      where: { financing_uuid: id },
    });

    this.logger.log(
      JSON.stringify({
        event: 'financing_deleted',
        financing_uuid: deletedFinancing.financing_uuid,
      }),
    );
    return deletedFinancing;
  }
}
