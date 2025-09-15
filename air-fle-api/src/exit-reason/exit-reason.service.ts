import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ExitReason } from '@prisma/client';

@Injectable()
export class ExitReasonService {
  private readonly logger = new Logger(ExitReasonService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<ExitReason[]> {
    return this.prisma.exitReason.findMany();
  }

  async findOne(id: string): Promise<ExitReason | null> {
    return this.prisma.exitReason.findUnique({
      where: { exit_reason_uuid: id },
    });
  }

  async create(
    createExitReasonData: Prisma.ExitReasonCreateInput,
  ): Promise<ExitReason> {
    const exitReason = await this.prisma.exitReason.create({
      data: createExitReasonData,
    });
    this.logger.log(
      JSON.stringify({
        event: 'exit_reason_created',
        exit_reason_uuid: exitReason.exit_reason_uuid,
        reason: exitReason.exit_reason,
      }),
    );
    return exitReason;
  }

  async update(
    id: string,
    updateExitReasonData: Prisma.ExitReasonUpdateInput,
  ): Promise<ExitReason> {
    const exitReason = await this.prisma.exitReason.update({
      where: { exit_reason_uuid: id },
      data: updateExitReasonData,
    });
    this.logger.log(
      JSON.stringify({
        event: 'exit_reason_updated',
        exit_reason_uuid: exitReason.exit_reason_uuid,
      }),
    );
    return exitReason;
  }

  async delete(id: string): Promise<ExitReason> {
    const exitReason = await this.prisma.exitReason.delete({
      where: { exit_reason_uuid: id },
    });
    this.logger.log(
      JSON.stringify({
        event: 'exit_reason_deleted',
        exit_reason_uuid: exitReason.exit_reason_uuid,
      }),
    );
    return exitReason;
  }
}
