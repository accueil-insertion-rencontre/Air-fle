import { environment } from '@environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiResponse } from '../models/reference-data.model';

export interface Subtask {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  createdAt: string;
  updatedAt: string;
  task_id: string;
}

export interface TaskStatistics {
  total: number;
  completed: number;
  pending: number;
  completionPercentage: number;
}

export interface GlobalStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  completionPercentage: number;
}

export interface TodoTask {
  id: string;
  title: string;
  description?: string;
  dueAt?: string;
  status: 'pending' | 'completed' | 'in_progress';
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
  user_id: string;
  user?: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    role_id: string;
    isActive: boolean;
  };
  subtasks?: Subtask[];
  statistics?: TaskStatistics;
}

export interface TasksResponse {
  tasks: TodoTask[];
  globalStats: GlobalStats;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  dueAt?: string;
  parentTaskId?: string;
}

export interface CreateTodoWithSubtasksRequest {
  title: string;
  description?: string;
  subtasks: SubtaskRequest[];
}

export interface SubtaskRequest {
  title: string;
  description?: string;
}

export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
}

// Réexport de l'interface ApiResponse
export type { ApiResponse } from '../models/reference-data.model';

@Injectable({
  providedIn: 'root',
})
export class TodolistService {
  private apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  // Adapte les réponses API (backend) vers le modèle attendu par le front
  private mapStatusFromNumeric(value: unknown): 'pending' | 'completed' | 'in_progress' {
    const n = Number(value ?? 0);
    if (Number.isNaN(n) || n <= 0) return 'pending';
    if (n >= 100) return 'completed';
    return 'in_progress';
  }

  private mapSubtask(raw: Record<string, unknown>): Subtask {
    return {
      id: (raw?.['subtask_uuid'] ?? raw?.['id'] ?? '') as string,
      title: (raw?.['subtask_title'] ?? raw?.['title'] ?? '') as string,
      description: (raw?.['subtask_description'] ?? raw?.['description']) as string | undefined,
      status: (raw?.['subtask_status'] ?? raw?.['status'] ?? 'pending') as 'pending' | 'completed',
      createdAt: (raw?.['subtask_created_at'] ?? raw?.['createdAt'] ?? new Date().toISOString()) as string,
      updatedAt: (raw?.['subtask_updated_at'] ?? raw?.['updatedAt'] ?? new Date().toISOString()) as string,
      task_id: (raw?.['task_uuid'] ?? raw?.['task_id'] ?? '') as string,
    };
  }

  private computeCompletion(subtasks: Subtask[] | undefined): number {
    if (!subtasks || subtasks.length === 0) return 0;
    const completed = subtasks.filter(s => s.status === 'completed').length;
    return Math.round((completed / subtasks.length) * 100);
  }

  private mapTask(raw: Record<string, unknown>): TodoTask {
    const subtasks: Subtask[] = Array.isArray(raw?.['subtasks'])
      ? raw['subtasks'].map((st: Record<string, unknown>) => this.mapSubtask(st))
      : [];

    const statsRaw = raw?.['statistics'] as Record<string, unknown>;
    const statistics: TaskStatistics | undefined = statsRaw
      ? {
          total: (statsRaw?.['total'] as number) ?? ((statsRaw?.['subtasks'] as Record<string, unknown>)?.['total'] as number) ?? subtasks.length ?? 0,
          completed:
            (statsRaw?.['completed'] as number) ?? ((statsRaw?.['subtasks'] as Record<string, unknown>)?.['completed'] as number) ??
            subtasks.filter(s => s.status === 'completed').length,
          pending:
            (statsRaw?.['pending'] as number) ?? ((statsRaw?.['subtasks'] as Record<string, unknown>)?.['pending'] as number) ??
            subtasks.filter(s => s.status !== 'completed').length,
          completionPercentage:
            Math.round(
              ((statsRaw?.['completionPercentage'] as number) ?? ((statsRaw?.['subtasks'] as Record<string, unknown>)?.['completionPercentage'] as number) ?? this.computeCompletion(subtasks))
            ),
        }
      : undefined;

    const completionPercentage = statistics?.completionPercentage ?? this.computeCompletion(subtasks);

    return {
      id: (raw?.['task_uuid'] ?? raw?.['id'] ?? '') as string,
      title: (raw?.['task_title'] ?? raw?.['title'] ?? '') as string,
      description: (raw?.['task_description'] ?? raw?.['description']) as string | undefined,
      dueAt: (raw?.['task_due_at'] ?? raw?.['dueAt']) as string | undefined,
      status: (raw?.['status'] as 'pending' | 'in_progress' | 'completed') ?? this.mapStatusFromNumeric(raw?.['task_status'] as number | undefined),
      completionPercentage,
      createdAt: (raw?.['task_created_at'] ?? raw?.['createdAt'] ?? new Date().toISOString()) as string,
      updatedAt: (raw?.['task_updated_at'] ?? raw?.['updatedAt'] ?? new Date().toISOString()) as string,
      user_id: (raw?.['user_uuid'] ?? raw?.['user_id'] ?? '') as string,
      user: raw?.['user']
        ? {
            id: (((raw['user'] as Record<string, unknown>)?.['user_uuid'] ?? (raw['user'] as Record<string, unknown>)?.['id']) as string) ?? '',
            email: (((raw['user'] as Record<string, unknown>)?.['user_mail'] ?? (raw['user'] as Record<string, unknown>)?.['email']) as string) ?? '',
            firstname: (((raw['user'] as Record<string, unknown>)?.['user_firstname'] ?? (raw['user'] as Record<string, unknown>)?.['firstname']) as string) ?? '',
            lastname: (((raw['user'] as Record<string, unknown>)?.['user_lastname'] ?? (raw['user'] as Record<string, unknown>)?.['lastname']) as string) ?? '',
            role_id: (((raw['user'] as Record<string, unknown>)?.['role_uuid'] ?? (raw['user'] as Record<string, unknown>)?.['role_id']) as string) ?? '',
            isActive: (((raw['user'] as Record<string, unknown>)?.['user_isactive'] ?? (raw['user'] as Record<string, unknown>)?.['isActive']) as boolean) ?? true,
          }
        : undefined,
      subtasks,
      statistics,
    };
  }

  /**
   * Récupère toutes les tâches de l'utilisateur connecté (API v1)
   */
  getTodolists(): Observable<TodoTask[]> {
    return this.http.get<ApiResponse<TasksResponse>>(this.apiUrl).pipe(
      map(response => {
        const rawTasks = response?.data?.tasks ?? [];
        return Array.isArray(rawTasks) ? rawTasks.map(t => this.mapTask(t as unknown as Record<string, unknown>)) : [];
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Récupère toutes les tâches avec les statistiques globales
   */
  getTasksWithStats(): Observable<TasksResponse> {
    return this.http.get<ApiResponse<TasksResponse>>(this.apiUrl).pipe(
      map(response => {
        const tasks = Array.isArray(response?.data?.tasks)
          ? response.data.tasks.map(t => this.mapTask(t as unknown as Record<string, unknown>))
          : [];
        const gs = response?.data?.globalStats;
        return {
          tasks,
          globalStats: gs ?? {
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'completed').length,
            inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
            pendingTasks: tasks.filter(t => t.status === 'pending').length,
            completionPercentage:
              tasks.length > 0
                ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
                : 0,
          },
        } as TasksResponse;
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Crée une nouvelle tâche (ancienne API - deprecated)
   */
  createTodolist(todo: CreateTodoRequest): Observable<TodoTask> {
    return this.http.post<ApiResponse<TodoTask>>(this.apiUrl, todo).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Crée une nouvelle tâche avec sous-tâches (nouvelle API v1)
   */
  createTodoWithSubtasks(todo: CreateTodoWithSubtasksRequest): Observable<TodoTask> {
    return this.http.post<ApiResponse<Record<string, unknown>>>(this.apiUrl, todo).pipe(
      map(response => this.mapTask(response.data)),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Toggle le statut d'une tâche (pending ↔ completed) - API v1
   */
  toggleTaskStatus(taskId: string): Observable<TodoTask> {
    return this.http
      .put<ApiResponse<Record<string, unknown>>>(`${this.apiUrl}/${taskId}/toggle-status`, {})
      .pipe(
        map(response => this.mapTask(response.data)),
        catchError(error => {
          throw error;
        })
      );
  }

  /**
   * Toggle le statut d'une sous-tâche (pending ↔ completed) - API v1
   */
  toggleSubtaskStatus(subtaskId: string): Observable<Subtask> {
    const subtaskUrl = `${environment.apiUrl}/tasks/subtasks/${subtaskId}/toggle`;
    return this.http.patch<ApiResponse<Record<string, unknown>>>(subtaskUrl, {}).pipe(
      map(response => this.mapSubtask(response.data)),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Supprime une tâche - API v1
   */
  deleteTodolist(taskId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${taskId}`).pipe(
      map(() => void 0),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Supprime une sous-tâche - API v1
   */
  deleteSubtask(subtaskId: string): Observable<void> {
    const subtaskUrl = `${environment.apiUrl}/tasks/subtasks/${subtaskId}`;
    return this.http.delete<ApiResponse<void>>(subtaskUrl).pipe(
      map(() => void 0),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Calcule les statistiques des tâches
   */
  calculateStats(tasks: TodoTask[]): TodoStats {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'completed').length;
    const pending = total - completed;

    return { total, completed, pending };
  }
} 