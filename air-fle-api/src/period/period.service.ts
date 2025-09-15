import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Period } from '@prisma/client';

@Injectable()
export class PeriodService {
  private readonly logger = new Logger(PeriodService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Period[]> {
    return this.prisma.period.findMany();
  }

  async findOne(id: string): Promise<Period | null> {
    return this.prisma.period.findUnique({
      where: { period_uuid: id },
    });
  }

  async create(createPeriodData: Prisma.PeriodCreateInput): Promise<Period> {
    const period = await this.prisma.period.create({
      data: createPeriodData,
    });
    this.logger.log(
      JSON.stringify({
        event: 'period_created',
        period_uuid: period.period_uuid,
        label: period.period_label,
      }),
    );
    return period;
  }

  async update(
    id: string,
    updatePeriodData: Prisma.PeriodUpdateInput,
  ): Promise<Period> {
    const period = await this.prisma.period.update({
      where: { period_uuid: id },
      data: updatePeriodData,
    });
    this.logger.log(
      JSON.stringify({
        event: 'period_updated',
        period_uuid: period.period_uuid,
      }),
    );
    return period;
  }

  async delete(id: string): Promise<Period> {
    const period = await this.prisma.period.delete({
      where: { period_uuid: id },
    });
    this.logger.log(
      JSON.stringify({
        event: 'period_deleted',
        period_uuid: period.period_uuid,
      }),
    );
    return period;
  }
}
