import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FrenchLevel, Prisma } from '@prisma/client';
import { FrenchLevelRepository } from './french-level.repository';

@Injectable()
export class FrenchLevelService {
  private readonly logger = new Logger(FrenchLevelService.name);
  constructor(private readonly frenchLevelRepository: FrenchLevelRepository) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    orderByCode?: boolean;
  }): Promise<FrenchLevel[]> {
    const { skip, take, orderByCode = true } = params || {};

    // ✅ Tri par code par défaut
    const orderBy = orderByCode
      ? { french_level_code: 'asc' as const }
      : { french_level_description: 'asc' as const };

    return this.frenchLevelRepository.findMany({
      skip,
      take,
      orderBy,
    });
  }

  async findOne(french_level_uuid: string): Promise<FrenchLevel | null> {
    return this.frenchLevelRepository.findUnique({
      where: { french_level_uuid },
    });
  }

  async create(data: Prisma.FrenchLevelCreateInput): Promise<FrenchLevel> {
    // ✅ Validation métier
    this.validateFrenchLevelData(data);

    // ✅ Vérification unicité du code
    if (data.french_level_code) {
      await this.checkCodeUniqueness(data.french_level_code);
    }

    // ✅ Normalisation automatique du code
    const normalizedData = this.normalizeLevelData(data);

    // ✅ Création via repository
    const level = await this.frenchLevelRepository.create(normalizedData as Prisma.FrenchLevelCreateInput);
    this.logger.log(
      JSON.stringify({
        event: 'french_level_created',
        french_level_uuid: level.french_level_uuid,
        code: level.french_level_code,
      }),
    );
    return level;
  }

  async update(
    french_level_uuid: string,
    data: Prisma.FrenchLevelUpdateInput,
  ): Promise<FrenchLevel> {
    // ✅ Vérification existence
    const existingLevel = await this.findOne(french_level_uuid);
    if (!existingLevel) {
      throw new NotFoundException('Niveau de français non trouvé');
    }

    // ✅ Validation métier
    if (data.french_level_code || data.french_level_description) {
      this.validateFrenchLevelData({
        french_level_code:
          (data.french_level_code as string) || existingLevel.french_level_code,
        french_level_description:
          (data.french_level_description as string) ||
          existingLevel.french_level_description,
      });
    }

    // ✅ Vérification unicité si code modifié
    if (
      data.french_level_code &&
      data.french_level_code !== existingLevel.french_level_code
    ) {
      await this.checkCodeUniqueness(data.french_level_code as string);
    }

    // ✅ Normalisation
    const normalizedData = this.normalizeLevelData(data);

    // ✅ Mise à jour via repository
    const level = await this.frenchLevelRepository.update({
      where: { french_level_uuid },
      data: normalizedData,
    });
    this.logger.log(
      JSON.stringify({
        event: 'french_level_updated',
        french_level_uuid,
      }),
    );
    return level;
  }

  async delete(french_level_uuid: string): Promise<FrenchLevel> {
    // ✅ Vérification existence
    const existingLevel = await this.findOne(french_level_uuid);
    if (!existingLevel) {
      throw new NotFoundException('Niveau de français non trouvé');
    }

    // ✅ Suppression via repository
    const level = await this.frenchLevelRepository.delete({
      french_level_uuid,
    });
    this.logger.log(
      JSON.stringify({
        event: 'french_level_deleted',
        french_level_uuid,
      }),
    );
    return level;
  }

  // ===============================
  // ✅ MÉTHODES PRIVÉES - LOGIQUE MÉTIER
  // ===============================

  private validateFrenchLevelData(data: {
    french_level_code: string;
    french_level_description: string;
  }): void {
    // ✅ Validation du code
    if (!data.french_level_code || data.french_level_code.trim().length === 0) {
      throw new BadRequestException('Le code du niveau est obligatoire');
    }

    if (data.french_level_code.length > 50) {
      throw new BadRequestException(
        'Le code ne peut pas dépasser 50 caractères',
      );
    }

    // ✅ Validation de la description
    if (
      !data.french_level_description ||
      data.french_level_description.trim().length === 0
    ) {
      throw new BadRequestException('La description du niveau est obligatoire');
    }

    if (data.french_level_description.length > 255) {
      throw new BadRequestException(
        'La description ne peut pas dépasser 255 caractères',
      );
    }

    // ✅ Validation format du code (lettres et chiffres uniquement)
    if (!/^[A-Za-z0-9]+$/.test(data.french_level_code.trim())) {
      throw new BadRequestException(
        'Le code ne peut contenir que des lettres et des chiffres',
      );
    }
  }

  private async checkCodeUniqueness(code: string): Promise<void> {
    const normalizedCode = code.trim().toUpperCase();
    const existingLevel =
      await this.frenchLevelRepository.findByCode(normalizedCode);
    if (existingLevel) {
      throw new BadRequestException(
        `Le niveau "${normalizedCode}" existe déjà`,
      );
    }
  }

  private normalizeLevelData(
    data: Prisma.FrenchLevelCreateInput | Prisma.FrenchLevelUpdateInput,
  ): Prisma.FrenchLevelCreateInput | Prisma.FrenchLevelUpdateInput {
    const normalized = { ...data } as Record<string, unknown>;

    if (data.french_level_code) {
      normalized.french_level_code = (data.french_level_code as string)
        .trim()
        .toUpperCase();
    }

    if (data.french_level_description) {
      normalized.french_level_description = (
        data.french_level_description as string
      ).trim();
    }

    return normalized;
  }
}
