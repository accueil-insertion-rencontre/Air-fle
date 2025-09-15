import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodolistService, TodoTask, Subtask } from '@core/services';

@Component({
  selector: 'app-todo-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './todo-item.component.html',
  styleUrls: ['./todo-item.component.scss'],
})
export class TodoItemComponent {
  @Input() task!: TodoTask | Subtask;
  @Input() isSubTask = false;
  @Output() taskUpdated = new EventEmitter<{
    subtaskId: string;
    updatedSubtask: TodoTask | Subtask;
  }>();

  isExpanded = false; // Pour les sous-tâches

  constructor(private todolistService: TodolistService) {}

  formatDueDate(dueAt?: string): string {
    if (!dueAt) return '';

    const date = new Date(dueAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Demain';
    if (diffDays === -1) return 'Hier';
    if (diffDays > 1) return `Dans ${diffDays} jours`;
    if (diffDays < -1) return `Il y a ${Math.abs(diffDays)} jours`;

    return date.toLocaleDateString('fr-FR');
  }

  isOverdue(dueAt?: string): boolean {
    if (!dueAt) return false;
    const date = new Date(dueAt);
    const now = new Date();
    return date < now && this.task.status !== 'completed';
  }

  toggleSubtaskStatus() {
    if (!this.isSubTask) return;

    this.todolistService.toggleSubtaskStatus(this.task.id).subscribe({
      next: (updatedSubtask) => {
        // Mettre à jour la tâche locale avec les nouvelles données
        Object.assign(this.task, updatedSubtask);
        this.taskUpdated.emit({
          subtaskId: this.task.id,
          updatedSubtask: this.task
        });
      },
      error: (error) => {
        // Gestion silencieuse de l'erreur en production
      }
    });
  }

  getCompletionPercentage(): number {
    if (this.isSubTask) return 0;

    // Type guard pour vérifier si c'est une TodoTask
    if ('completionPercentage' in this.task) {
      return this.task.completionPercentage || 0;
    }

    return 0;
  }

  getStatusLabel(): string {
    switch (this.task.status) {
      case 'pending':
        return 'En attente';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      default:
        return 'Inconnu';
    }
  }

  getStatusColor(): string {
    switch (this.task.status) {
      case 'pending':
        return '#6b7280';
      case 'in_progress':
        return '#f59e0b';
      case 'completed':
        return '#10b981';
      default:
        return '#6b7280';
    }
  }

  toggleExpand() {
    if (
      !this.isSubTask &&
      'subtasks' in this.task &&
      this.task.subtasks &&
      this.task.subtasks.length > 0
    ) {
      this.isExpanded = !this.isExpanded;
    }
  }

  hasSubtasks(): boolean {
    return (
      !this.isSubTask &&
      'subtasks' in this.task &&
      Boolean(this.task.subtasks && this.task.subtasks.length > 0)
    );
  }

  // Type guards pour le template
  isMainTask(): boolean {
    return 'subtasks' in this.task;
  }

  getMainTask(): TodoTask {
    return this.task as TodoTask;
  }
}
