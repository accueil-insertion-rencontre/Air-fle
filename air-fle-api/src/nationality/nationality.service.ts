import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Nationality, Prisma } from '@prisma/client';
import { NationalityRepository } from './nationality.repository';

@Injectable()
export class NationalityService {
  private readonly logger = new Logger(NationalityService.name);
  constructor(private readonly nationalityRepository: NationalityRepository) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    nationality_label?: string;
  }): Promise<Nationality[]> {
    const { skip, take, nationality_label } = params || {};

    const where: Prisma.NationalityWhereInput = {};

    if (nationality_label) {
      where.nationality_label = {
        contains: nationality_label,
        mode: 'insensitive',
      };
    }

    return this.nationalityRepository.findMany({
      skip,
      take,
      where,
      orderBy: { nationality_label: 'asc' },
    });
  }

  async findOne(nationality_uuid: string): Promise<Nationality | null> {
    return this.nationalityRepository.findUnique({
      where: { nationality_uuid },
    });
  }

  async create(data: Prisma.NationalityCreateInput): Promise<Nationality> {
    // ✅ Validation métier
    this.validateNationalityData(data);

    // ✅ Vérification unicité
    await this.checkLabelUniqueness(data.nationality_label);

    // ✅ Création via repository
    const nationality = await this.nationalityRepository.create(data);
    this.logger.log(
      JSON.stringify({
        event: 'nationality_created',
        nationality_uuid: nationality.nationality_uuid,
        label: nationality.nationality_label,
      }),
    );
    return nationality;
  }

  async update(
    nationality_uuid: string,
    data: Prisma.NationalityUpdateInput,
  ): Promise<Nationality> {
    // ✅ Vérification existence
    const existingNationality = await this.findOne(nationality_uuid);
    if (!existingNationality) {
      throw new NotFoundException('Nationalité non trouvée');
    }

    // ✅ Validation métier si label modifié
    if (data.nationality_label) {
      this.validateNationalityData({
        nationality_label: data.nationality_label as string,
      });

      // ✅ Vérification unicité si différent
      if (data.nationality_label !== existingNationality.nationality_label) {
        await this.checkLabelUniqueness(data.nationality_label as string);
      }
    }

    // ✅ Mise à jour via repository
    const nationality = await this.nationalityRepository.update({
      where: { nationality_uuid },
      data,
    });
    this.logger.log(
      JSON.stringify({
        event: 'nationality_updated',
        nationality_uuid,
      }),
    );
    return nationality;
  }

  async delete(nationality_uuid: string): Promise<Nationality> {
    // ✅ Vérification existence
    const existingNationality = await this.findOne(nationality_uuid);
    if (!existingNationality) {
      throw new NotFoundException('Nationalité non trouvée');
    }

    // ✅ Suppression via repository
    const nationality = await this.nationalityRepository.delete({
      nationality_uuid,
    });
    this.logger.log(
      JSON.stringify({
        event: 'nationality_deleted',
        nationality_uuid,
      }),
    );
    return nationality;
  }

  // ===============================
  // ✅ MÉTHODES PRIVÉES - LOGIQUE MÉTIER
  // ===============================

  private validateNationalityData(data: { nationality_label: string }): void {
    // ✅ Validation du label
    if (!data.nationality_label || data.nationality_label.trim().length === 0) {
      throw new BadRequestException(
        'Le libellé de la nationalité est obligatoire',
      );
    }

    if (data.nationality_label.trim().length < 2) {
      throw new BadRequestException(
        'Le libellé doit contenir au moins 2 caractères',
      );
    }

    if (data.nationality_label.length > 256) {
      throw new BadRequestException(
        'Le libellé ne peut pas dépasser 256 caractères',
      );
    }

    // ✅ Validation format (pas de caractères spéciaux dangereux)
    if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(data.nationality_label)) {
      throw new BadRequestException(
        'Le libellé contient des caractères non autorisés',
      );
    }
  }

  private async checkLabelUniqueness(label: string): Promise<void> {
    const existingNationality = await this.nationalityRepository.findByLabel(
      label.trim(),
    );
    if (existingNationality) {
      throw new BadRequestException(`La nationalité "${label}" existe déjà`);
    }
  }
}
