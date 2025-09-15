import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { SubtaskService, SubtaskWithRelations } from './subtask.service';
import { Task } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly subtaskService: SubtaskService,
  ) {}

  // ===== TASKS =====

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle tâche' })
  @ApiResponse({ status: 201, description: 'Tâche créée avec succès' })
  async create(@Request() req, @Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(req.user.user_uuid, createTaskDto);
  }

  @Get()
  @ApiOperation({
    summary: "Récupérer toutes les tâches de l'utilisateur avec statistiques",
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des tâches avec statistiques récupérée avec succès',
  })
  async findAll(@Request() req) {
    return this.taskService.getAllTasksWithStats(req.user.user_uuid);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une tâche par ID' })
  @ApiResponse({ status: 200, description: 'Tâche récupérée avec succès' })
  @ApiParam({ name: 'id', description: 'ID de la tâche' })
  async findOneTask(
    @Request() req,
    @Param('id') id: string,
  ): Promise<Task | null> {
    const task = await this.taskService.findOne(id);
    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    // Vérifier que l'utilisateur est le propriétaire de la tâche
    if (task.user_uuid !== req.user.user_uuid) {
      throw new ForbiddenException(
        "Vous ne pouvez accéder qu'à vos propres tâches",
      );
    }

    return task;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une tâche' })
  @ApiResponse({ status: 200, description: 'Tâche mise à jour avec succès' })
  @ApiParam({ name: 'id', description: 'ID de la tâche' })
  async updateTask(
    @Request() req,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    // Vérifier que l'utilisateur est le propriétaire de la tâche
    const task = await this.taskService.findOne(id);
    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    if (task.user_uuid !== req.user.user_uuid) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres tâches',
      );
    }

    return this.taskService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une tâche' })
  @ApiResponse({ status: 200, description: 'Tâche supprimée avec succès' })
  @ApiParam({ name: 'id', description: 'ID de la tâche' })
  async deleteTask(@Request() req, @Param('id') id: string): Promise<Task> {
    // Vérifier que l'utilisateur est le propriétaire de la tâche
    const task = await this.taskService.findOne(id);
    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    if (task.user_uuid !== req.user.user_uuid) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres tâches',
      );
    }

    return this.taskService.delete(id);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: "Statistiques d'une tâche" })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  @ApiParam({ name: 'id', description: 'ID de la tâche' })
  async getTaskStatistics(
    @Request() req,
    @Param('id') id: string,
  ): Promise<any> {
    // Vérifier que l'utilisateur est le propriétaire de la tâche
    const task = await this.taskService.findOne(id);
    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    if (task.user_uuid !== req.user.user_uuid) {
      throw new ForbiddenException(
        "Vous ne pouvez accéder qu'aux statistiques de vos propres tâches",
      );
    }

    return this.taskService.getStatistics(id);
  }

  // ===== SUBTASKS =====

  @Post(':taskId/subtasks')
  @ApiOperation({
    summary: 'Créer une sous-tâche',
    description: 'Ajoute une nouvelle sous-tâche à une tâche existante',
  })
  @ApiResponse({ status: 201, description: 'Sous-tâche créée avec succès' })
  @ApiParam({ name: 'taskId', description: 'ID de la tâche parent' })
  async createSubtask(
    @Request() req,
    @Param('taskId') taskId: string,
    @Body() createSubtaskDto: CreateSubtaskDto,
  ): Promise<SubtaskWithRelations> {
    // Vérifier que la tâche parent appartient à l'utilisateur
    const task = await this.taskService.findOne(taskId);
    if (!task) {
      throw new NotFoundException('Tâche parent non trouvée');
    }

    if (task.user_uuid !== req.user.user_uuid) {
      throw new ForbiddenException(
        "Vous ne pouvez ajouter des sous-tâches qu'à vos propres tâches",
      );
    }

    return this.subtaskService.create(taskId, createSubtaskDto);
  }

  @Get(':taskId/subtasks')
  @ApiOperation({
    summary: "Récupérer les sous-tâches d'une tâche",
    description: "Récupère toutes les sous-tâches d'une tâche spécifique",
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des sous-tâches récupérée avec succès',
  })
  @ApiParam({ name: 'taskId', description: 'ID de la tâche' })
  async findAllSubtasks(
    @Request() req,
    @Param('taskId') taskId: string,
  ): Promise<SubtaskWithRelations[]> {
    // Vérifier que la tâche appartient à l'utilisateur
    const task = await this.taskService.findOne(taskId);
    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    if (task.user_uuid !== req.user.user_uuid) {
      throw new ForbiddenException(
        "Vous ne pouvez accéder qu'aux sous-tâches de vos propres tâches",
      );
    }

    return this.subtaskService.findAll(taskId);
  }

  @Get('subtasks/:id')
  @ApiOperation({ summary: 'Récupérer une sous-tâche par ID' })
  @ApiResponse({ status: 200, description: 'Sous-tâche récupérée avec succès' })
  @ApiParam({ name: 'id', description: 'ID de la sous-tâche' })
  async findOneSubtask(
    @Request() req,
    @Param('id') id: string,
  ): Promise<SubtaskWithRelations | null> {
    const subtask = await this.subtaskService.findOne(id);
    if (!subtask) {
      throw new NotFoundException('Sous-tâche non trouvée');
    }

    // Vérifier que l'utilisateur est le propriétaire de la tâche parent
    if (subtask.task.user_uuid !== req.user.user_uuid) {
      throw new ForbiddenException(
        "Vous ne pouvez accéder qu'à vos propres sous-tâches",
      );
    }

    return subtask;
  }

  @Patch('subtasks/:id')
  @ApiOperation({ summary: 'Mettre à jour une sous-tâche' })
  @ApiResponse({
    status: 200,
    description: 'Sous-tâche mise à jour avec succès',
  })
  @ApiParam({ name: 'id', description: 'ID de la sous-tâche' })
  async updateSubtask(
    @Request() req,
    @Param('id') id: string,
    @Body() updateSubtaskDto: UpdateSubtaskDto,
  ): Promise<SubtaskWithRelations> {
    const subtask = await this.subtaskService.findOne(id);
    if (!subtask) {
      throw new NotFoundException('Sous-tâche non trouvée');
    }

    // Vérifier que l'utilisateur est le propriétaire de la tâche parent
    if (subtask.task.user_uuid !== req.user.user_uuid) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres sous-tâches',
      );
    }

    return this.subtaskService.update(id, updateSubtaskDto);
  }

  @Delete('subtasks/:id')
  @ApiOperation({ summary: 'Supprimer une sous-tâche' })
  @ApiResponse({ status: 200, description: 'Sous-tâche supprimée avec succès' })
  @ApiParam({ name: 'id', description: 'ID de la sous-tâche' })
  async deleteSubtask(
    @Request() req,
    @Param('id') id: string,
  ): Promise<SubtaskWithRelations> {
    const subtask = await this.subtaskService.findOne(id);
    if (!subtask) {
      throw new NotFoundException('Sous-tâche non trouvée');
    }

    // Vérifier que l'utilisateur est le propriétaire de la tâche parent
    if (subtask.task.user_uuid !== req.user.user_uuid) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres sous-tâches',
      );
    }

    return this.subtaskService.delete(id);
  }

  @Patch('subtasks/:id/toggle')
  @ApiOperation({ summary: "Basculer le statut d'une sous-tâche" })
  @ApiResponse({
    status: 200,
    description: 'Statut de la sous-tâche basculé avec succès',
  })
  @ApiParam({ name: 'id', description: 'ID de la sous-tâche' })
  async toggleSubtaskStatus(
    @Request() req,
    @Param('id') id: string,
  ): Promise<SubtaskWithRelations> {
    const subtask = await this.subtaskService.findOne(id);
    if (!subtask) {
      throw new NotFoundException('Sous-tâche non trouvée');
    }

    // Vérifier que l'utilisateur est le propriétaire de la tâche parent
    if (subtask.task.user_uuid !== req.user.user_uuid) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres sous-tâches',
      );
    }

    return this.subtaskService.toggleStatus(id);
  }
}
