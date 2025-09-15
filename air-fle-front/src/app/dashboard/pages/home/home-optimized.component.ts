import {
  Component,
  OnInit,
  AfterViewInit,
  NgZone,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter, shareReplay, takeUntilDestroyed } from 'rxjs/operators';
import { StudentService } from '../apprenants/services/student.service';
import {
  TodolistService,
  TodoTask,
  CreateTodoWithSubtasksRequest,
  TodoStats,
} from '../../services/todolist.service';
import { CreateTodoModalComponent } from '../../components/create-todo-modal/create-todo-modal.component';
import { TodoItemComponent } from '../../components/todo-item/todo-item.component';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith, catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

declare var feather: any;

interface StatCard {
  title: string;
  value: string;
  change: number | null;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-home-optimized',
  standalone: true,
  imports: [CommonModule, CreateTodoModalComponent, TodoItemComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush, // 🔥 Optimisation OnPush
})
export class HomeOptimizedComponent implements OnInit, AfterViewInit {
  // 🔥 Injection moderne avec inject()
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly studentService = inject(StudentService);
  private readonly todolistService = inject(TodolistService);

  // 🔥 Utilisation d'Observables au lieu de subscriptions manuelles
  readonly studentCount$ = this.studentService
    .getStudentCount()
    .pipe(startWith(0), shareReplay(1), takeUntilDestroyed());

  readonly todos$ = this.todolistService.getTodolists().pipe(
    map(todos => (Array.isArray(todos) ? todos : [])),
    shareReplay(1),
    takeUntilDestroyed(),
    catchError(() => [])
  );

  readonly todoStats$ = this.todos$.pipe(map(todos => this.todolistService.calculateStats(todos)));

  readonly parentTasks$ = this.todos$.pipe(map(todos => todos.filter(task => !task.parent_id)));

  // 🔥 States réactifs
  private readonly isCreateModalOpenSubject = new BehaviorSubject(false);
  readonly isCreateModalOpen$ = this.isCreateModalOpenSubject.asObservable();

  private readonly isCreatingTodoSubject = new BehaviorSubject(false);
  readonly isCreatingTodo$ = this.isCreatingTodoSubject.asObservable();

  private readonly todoErrorSubject = new BehaviorSubject<string | null>(null);
  readonly todoError$ = this.todoErrorSubject.asObservable();

  // 🔥 Computed values avec combineLatest
  readonly statCards$ = combineLatest([this.studentCount$, this.todoStats$]).pipe(
    map(([studentCount, stats]) => [
      {
        title: 'Total Étudiants',
        value: studentCount.toString(),
        change: null,
        icon: 'users',
        color: 'primary',
      },
      {
        title: 'Tâches Terminées',
        value: stats.completedTasks.toString(),
        change: null,
        icon: 'check-circle',
        color: 'success',
      },
      {
        title: 'Tâches En Cours',
        value: stats.inProgressTasks.toString(),
        change: null,
        icon: 'clock',
        color: 'warning',
      },
      {
        title: 'Tâches En Attente',
        value: stats.pendingTasks.toString(),
        change: null,
        icon: 'circle',
        color: 'info',
      },
    ])
  );

  // 🔥 Computed counts
  readonly filteredTasksCount$ = this.parentTasks$.pipe(map(tasks => tasks.length));

  readonly pendingTasksCount$ = this.todos$.pipe(
    map(todos => todos.filter(t => t.status === 'pending').length)
  );

  readonly inProgressTasksCount$ = this.todos$.pipe(
    map(todos => todos.filter(t => t.status === 'in_progress').length)
  );

  readonly completedTasksCount$ = this.todos$.pipe(
    map(todos => todos.filter(t => t.status === 'completed').length)
  );

  ngOnInit() {
    // 🔥 Gestion automatique des subscriptions avec takeUntilDestroyed
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        setTimeout(() => this.initFeatherIcons(), 100);
      });
  }

  ngAfterViewInit() {
    this.initFeatherIcons();
  }

  // 🔥 Méthodes optimisées
  initFeatherIcons() {
    try {
      if (typeof feather !== 'undefined') {
        this.ngZone.runOutsideAngular(() => {
          feather.replace();
        });
      }
    } catch (error) {
      console.warn('Feather icons initialization failed:', error);
    }
  }

  openCreateModal() {
    this.isCreateModalOpenSubject.next(true);
  }

  closeCreateModal() {
    this.isCreateModalOpenSubject.next(false);
  }

  // 🔥 Validation améliorée
  private validateTodoData(data: CreateTodoWithSubtasksRequest): boolean {
    return !!(data.title?.trim() && data.subtasks?.length > 0);
  }

  // 🔥 Sanitisation améliorée
  private sanitizeTodoData(data: any): CreateTodoWithSubtasksRequest {
    return {
      title: data.title?.trim() || '',
      description: data.description?.trim() || '',
      dueAt: data.dueAt || null,
      priority: data.priority || 'medium',
      subtasks: Array.isArray(data.subtasks)
        ? data.subtasks
            .filter((subtask: any) => subtask.title?.trim())
            .map((subtask: any) => ({
              title: subtask.title.trim(),
              description: subtask.description?.trim() || '',
            }))
        : [],
    };
  }

  onCreateTodo(todoData: any) {
    const cleanData = this.sanitizeTodoData(todoData);

    if (!this.validateTodoData(cleanData)) {
      this.todoErrorSubject.next('Données invalides: titre et sous-tâches requis');
      return;
    }

    this.isCreatingTodoSubject.next(true);
    this.todoErrorSubject.next(null);

    this.todolistService
      .createTodoWithSubtasks(cleanData)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => {
          this.isCreatingTodoSubject.next(false);
          this.closeCreateModal();
          // Le rechargement se fait automatiquement via l'observable todos$
        },
        error: error => {
          this.todoErrorSubject.next('Erreur lors de la création de la tâche');
          this.isCreatingTodoSubject.next(false);
          console.error('Create todo error:', error);
        },
      });
  }

  onTaskUpdated(updatedTask: TodoTask) {
    // Le rechargement se fait automatiquement via l'observable todos$
  }

  // 🔥 TrackBy functions pour l'optimisation
  trackByTaskId = (index: number, task: TodoTask): string => task.id;
  trackByStatIndex = (index: number): number => index;
}
