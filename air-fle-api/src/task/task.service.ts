import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

// Type pour une tâche avec ses relations
type TaskWithRelations = Prisma.TaskGetPayload<{
  include: {
    user: true;
    subtasks: true;
  };
}>;

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string): Promise<TaskWithRelations[]> {
    return this.prisma.task.findMany({
      where: { user_uuid: userId },
      include: {
        user: true,
        subtasks: {
          orderBy: { subtask_created_at: 'asc' },
        },
      },
      orderBy: { task_created_at: 'desc' },
    });
  }

  async findOne(id: string): Promise<TaskWithRelations | null> {
    return this.prisma.task.findUnique({
      where: { task_uuid: id },
      include: {
        user: true,
        subtasks: {
          orderBy: { subtask_created_at: 'asc' },
        },
      },
    });
  }

  async create(
    userId: string,
    createTaskDto: CreateTaskDto,
  ): Promise<TaskWithRelations> {
    const { subtasks, ...taskData } = createTaskDto;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Créer la tâche
      const task = await prisma.task.create({
        data: {
          task_title: taskData.title,
          task_description: taskData.description,
          task_status: 0, // pending = 0
          task_created_at: new Date(),
          task_updated_at: new Date(),
          task_due_at: taskData.dueAt,
          user_uuid: userId,
        },
      });

      this.logger.log(
        JSON.stringify({
          event: 'task_created',
          task_uuid: task.task_uuid,
          user_uuid: userId,
        }),
      );

      // 2. Créer les sous-tâches si elles existent
      if (subtasks && subtasks.length > 0) {
        await Promise.all(
          subtasks.map((subtask) =>
            prisma.subtask.create({
              data: {
                subtask_title: subtask.title,
                subtask_description: subtask.description,
                subtask_status: 'pending',
                subtask_created_at: new Date(),
                subtask_updated_at: new Date(),
                task_uuid: task.task_uuid,
              },
            }),
          ),
        );
      }

      // 3. Retourner la tâche avec ses sous-tâches
      return prisma.task.findUnique({
        where: { task_uuid: task.task_uuid },
        include: {
          user: true,
          subtasks: {
            orderBy: { subtask_created_at: 'asc' },
          },
        },
      }) as Promise<TaskWithRelations>;
    });
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<TaskWithRelations> {
    const task = await this.findOne(id);
    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    const updated = await this.prisma.task.update({
      where: { task_uuid: id },
      data: {
        task_title: updateTaskDto.title,
        task_description: updateTaskDto.description,
        task_status:
          updateTaskDto.status !== undefined
            ? Number(updateTaskDto.status)
            : undefined,
        task_updated_at: new Date(),
        task_due_at: updateTaskDto.dueAt,
      },
      include: {
        user: true,
        subtasks: {
          orderBy: { subtask_created_at: 'asc' },
        },
      },
    });

    this.logger.log(
      JSON.stringify({ event: 'task_updated', task_uuid: updated.task_uuid }),
    );
    return updated;
  }

  async delete(id: string): Promise<TaskWithRelations> {
    const task = await this.findOne(id);
    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    const deleted = await this.prisma.task.delete({
      where: { task_uuid: id },
      include: {
        user: true,
        subtasks: true,
      },
    });

    this.logger.log(
      JSON.stringify({ event: 'task_deleted', task_uuid: deleted.task_uuid }),
    );
    return deleted;
  }

  /**
   * Récupère les statistiques d'une tâche
   */
  async getStatistics(id: string): Promise<any> {
    const task = await this.findOne(id);
    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    const totalSubtasks = task.subtasks.length;
    const completedSubtasks = task.subtasks.filter(
      (subtask) => subtask.subtask_status === 'completed',
    ).length;
    const pendingSubtasks = task.subtasks.filter(
      (subtask) => subtask.subtask_status === 'pending',
    ).length;

    const completionPercentage =
      totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

    return {
      task: {
        id: task.task_uuid,
        title: task.task_title,
        status: task.task_status,
      },
      subtasks: {
        total: totalSubtasks,
        completed: completedSubtasks,
        pending: pendingSubtasks,
        completionPercentage: Math.round(completionPercentage * 100) / 100,
      },
    };
  }

  /**
   * Récupère toutes les tâches de l'utilisateur avec leurs statistiques
   */
  async getAllTasksWithStats(userId: string): Promise<any> {
    const tasks = await this.findAll(userId);

    const tasksWithStats = await Promise.all(
      tasks.map(async (task) => {
        const stats = await this.getStatistics(task.task_uuid);
        return {
          ...task,
          statistics: stats.subtasks,
        };
      }),
    );

    // Statistiques globales - conversion du status numérique vers string pour comparaison
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (task) => Number(task.task_status) === 100,
    ).length;
    const inProgressTasks = tasks.filter(
      (task) => Number(task.task_status) > 0 && Number(task.task_status) < 100,
    ).length;
    const pendingTasks = tasks.filter(
      (task) => Number(task.task_status) === 0,
    ).length;

    return {
      tasks: tasksWithStats,
      globalStats: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        completionPercentage:
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
    };
  }
}
