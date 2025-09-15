import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';

// Type pour une subtask avec ses relations - EXPORTÉ !
export type SubtaskWithRelations = Prisma.SubtaskGetPayload<{
  include: {
    task: true;
  };
}>;

@Injectable()
export class SubtaskService {
  private readonly logger = new Logger(SubtaskService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(taskId: string): Promise<SubtaskWithRelations[]> {
    return this.prisma.subtask.findMany({
      where: { task_uuid: taskId },
      include: {
        task: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { subtask_created_at: 'asc' },
    });
  }

  async findOne(id: string): Promise<SubtaskWithRelations | null> {
    return this.prisma.subtask.findUnique({
      where: { subtask_uuid: id },
      include: {
        task: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async create(
    taskId: string,
    createSubtaskDto: CreateSubtaskDto,
  ): Promise<SubtaskWithRelations> {
    const subtask = await this.prisma.subtask.create({
      data: {
        subtask_title: createSubtaskDto.title,
        subtask_description: createSubtaskDto.description || null,
        subtask_status: createSubtaskDto.status || 'pending',
        subtask_created_at: new Date(),
        subtask_updated_at: new Date(),
        task: {
          connect: { task_uuid: taskId },
        },
      },
      include: {
        task: {
          include: {
            user: true,
          },
        },
      },
    });

    this.logger.log(
      JSON.stringify({
        event: 'subtask_created',
        subtask_uuid: subtask.subtask_uuid,
        task_uuid: taskId,
      }),
    );

    // Mettre à jour le progrès de la tâche parent
    await this.updateTaskProgress(taskId);

    return subtask;
  }

  async update(
    id: string,
    updateSubtaskDto: UpdateSubtaskDto,
  ): Promise<SubtaskWithRelations> {
    // Conversion du DTO en format Prisma
    const prismaData: Prisma.SubtaskUpdateInput = {};

    if (updateSubtaskDto.title !== undefined) {
      prismaData.subtask_title = updateSubtaskDto.title;
    }

    if (updateSubtaskDto.description !== undefined) {
      prismaData.subtask_description = updateSubtaskDto.description;
    }

    if (updateSubtaskDto.status !== undefined) {
      prismaData.subtask_status = updateSubtaskDto.status;
    }

    prismaData.subtask_updated_at = new Date();

    const updatedSubtask = await this.prisma.subtask.update({
      where: { subtask_uuid: id },
      data: prismaData,
      include: {
        task: {
          include: {
            user: true,
          },
        },
      },
    });

    this.logger.log(
      JSON.stringify({
        event: 'subtask_updated',
        subtask_uuid: updatedSubtask.subtask_uuid,
      }),
    );

    // Mettre à jour le progrès de la tâche parent
    await this.updateTaskProgress(updatedSubtask.task_uuid);

    return updatedSubtask;
  }

  async toggleStatus(id: string): Promise<SubtaskWithRelations> {
    const subtask = await this.findOne(id);
    if (!subtask) {
      throw new NotFoundException('Sous-tâche non trouvée');
    }

    const newStatus: 'pending' | 'completed' =
      subtask.subtask_status === 'completed' ? 'pending' : 'completed';

    const updatedSubtask = await this.prisma.subtask.update({
      where: { subtask_uuid: id },
      data: {
        subtask_status: newStatus,
        subtask_updated_at: new Date(),
      },
      include: {
        task: {
          include: {
            user: true,
          },
        },
      },
    });

    this.logger.log(
      JSON.stringify({
        event: 'subtask_toggled',
        subtask_uuid: updatedSubtask.subtask_uuid,
        status: updatedSubtask.subtask_status,
      }),
    );

    // Mettre à jour le progrès de la tâche parent
    await this.updateTaskProgress(updatedSubtask.task_uuid);

    return updatedSubtask;
  }

  async delete(id: string): Promise<SubtaskWithRelations> {
    const subtask = await this.prisma.subtask.delete({
      where: { subtask_uuid: id },
      include: {
        task: {
          include: {
            user: true,
          },
        },
      },
    });

    this.logger.log(
      JSON.stringify({
        event: 'subtask_deleted',
        subtask_uuid: subtask.subtask_uuid,
      }),
    );

    // Mettre à jour le progrès de la tâche parent
    await this.updateTaskProgress(subtask.task_uuid);

    return subtask;
  }

  private async updateTaskProgress(taskId: string): Promise<void> {
    const task = await this.prisma.task.findUnique({
      where: { task_uuid: taskId },
      include: {
        subtasks: true,
      },
    });

    if (!task) {
      return;
    }

    const totalSubtasks = task.subtasks.length;

    if (totalSubtasks === 0) {
      return;
    }

    const completedSubtasks = task.subtasks.filter(
      (subtask) => subtask.subtask_status === 'completed',
    ).length;

    const progressPercentage = Math.round(
      (completedSubtasks / totalSubtasks) * 100,
    );

    // Déterminer le statut basé sur le pourcentage
    let status: number;
    if (progressPercentage === 0) {
      status = 0; // pending
    } else if (progressPercentage === 100) {
      status = 100; // completed
    } else {
      status = progressPercentage; // in_progress avec pourcentage
    }

    await this.prisma.task.update({
      where: { task_uuid: taskId },
      data: {
        task_status: status,
        task_updated_at: new Date(),
      },
    });
  }
}
