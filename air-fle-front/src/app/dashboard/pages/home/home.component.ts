import { Component, AfterViewInit, OnInit, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import {
  StudentService,
  TodolistService,
  TodoTask,
  TodoStats,
  CreateTodoWithSubtasksRequest,
  Subtask,
  CourseService,
  AttendanceService,
  SessionService,
  GroupService,
} from '@core/services';
import { Course, Student } from '@core/models';
import { CreateTodoModalComponent } from '../../components/create-todo-modal/create-todo-modal.component';
import { TodoItemComponent } from '../../components/todo-item/todo-item.component';
import { Subscription } from 'rxjs';

declare let feather: { replace: () => void };

interface StatCard {
  title: string;
  value: string;
  change: number | null;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateTodoModalComponent, TodoItemComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private studentCountSubscription?: Subscription;
  private todoSubscription?: Subscription;

  // Cartes statistiques
  statCards: StatCard[] = [
    { title: 'Apprenants', value: '0', change: null, icon: 'user', color: '#4fd1c5' },
    { title: 'Adresses', value: 'Aucune donnée', change: null, icon: 'map-pin', color: '#4fd1c5' },
    { title: 'Période', value: 'Aucune donnée', change: null, icon: 'calendar', color: '#4fd1c5' },
    {
      title: 'Taux de Réussite',
      value: 'Aucune donnée',
      change: null,
      icon: 'bar-chart-2',
      color: '#4fd1c5',
    },
  ];

  // Données pour le graphique (vide pour l'instant)
  chartData = {
    labels: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
    datasets: [],
  };

  // Todo list
  todoItems: TodoTask[] = [];
  todoStats: TodoStats = { total: 0, completed: 0, pending: 0 };
  isLoadingTodos = false;
  todoError: string | null = null;

  // Modal
  isCreateModalOpen = false;
  isCreatingTodo = false;

  // Filtres
  activeFilter: 'all' | 'pending' | 'in_progress' | 'completed' = 'all';
  showFilters = false;

  // Modules de la journée
  todayModules: Course[] = [];
  currentModule: Course | null = null;
  nextModule: Course | null = null;
  isLoadingTodayModules = false;
  todayModulesError: string | null = null;
  // Modale de prise d'appel (intégrée)
  showAttendanceModal = false;
  attendanceState: 'loading'|'ready'|'error' = 'loading';
  attendanceError = '';
  attendanceData: { course_uuid: string; students: Student[]; attendance_taken?: boolean } | null = null;
  attendanceForm: { student_uuid: string; status: 'present'|'absent'|'justified' }[] = [];
  
  // Gestion des présences du module actuel
  isSavingAttendance = false;

  // Semaine d'enseignement
  currentWeek: Date = new Date();
  weekDays: { date: Date; dayName: string; dayNumber: number; isToday: boolean }[] = [];
  weekCourses: Course[] = [];
  isLoadingWeekCourses = false;
  weekCoursesError: string | null = null;

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private studentService: StudentService,
    private todolistService: TodolistService,
    private courseService: CourseService,
    private attendanceService: AttendanceService,
    private sessionService: SessionService,
    private groupService: GroupService
  ) {}

  ngOnInit() {
    // S'abonner aux événements de navigation pour mettre à jour les icônes
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      setTimeout(() => {
        this.initFeatherIcons();
      }, 100);
    });

    // S'abonner au nombre d'étudiants
    this.studentCountSubscription = this.studentService.getStudentCount().subscribe(count => {
      this.statCards[0].value = count.toString();
    });

    // Charger les tâches
    this.loadTodos();
    
    // Charger la semaine d'enseignement
    this.generateWeekView();
    this.loadWeekCourses();
    
    // Charger les modules de la journée
    this.loadTodayModules();
  }

  ngAfterViewInit() {
    // Initialiser les icônes après le rendu de la vue
    setTimeout(() => {
      this.initFeatherIcons();
    }, 0);
  }

  ngOnDestroy() {
    if (this.studentCountSubscription) {
      this.studentCountSubscription.unsubscribe();
    }
    if (this.todoSubscription) {
      this.todoSubscription.unsubscribe();
    }
  }

  initFeatherIcons() {
    try {
      if (typeof feather !== 'undefined') {
        this.ngZone.runOutsideAngular(() => {
          feather.replace();
        });
      }
    } catch {
      // Gestion silencieuse de l'erreur
    }
  }

  // Méthodes Todo List
  loadTodos() {
    this.isLoadingTodos = true;
    this.todoError = null;

    this.todoSubscription = this.todolistService.getTodolists().subscribe({
      next: todos => {
        this.todoItems = Array.isArray(todos) ? todos : [];
        this.todoStats = this.todolistService.calculateStats(this.todoItems);
        this.isLoadingTodos = false;
      },
      error: () => {
        this.todoError = 'Erreur lors du chargement des tâches';
        this.todoItems = [];
        this.isLoadingTodos = false;
      },
    });
  }

  openCreateModal() {
    this.isCreateModalOpen = true;
  }

  closeCreateModal() {
    this.isCreateModalOpen = false;
  }

  /**
   * Nettoie les données brutes pour créer un objet sûr à envoyer à l'API
   */
  private sanitizeTodoData(rawData: { title?: string; description?: string; subtasks?: { title?: string; description?: string }[] }): CreateTodoWithSubtasksRequest {
    return {
      title: String(rawData?.title || '').trim(),
      description: rawData?.description ? String(rawData.description).trim() : undefined,
      subtasks: Array.isArray(rawData?.subtasks)
        ? rawData.subtasks
            .map((subtask: Record<string, unknown>) => ({
              title: String(subtask?.['title'] || '').trim(),
              description: subtask?.['description'] ? String(subtask['description']).trim() : undefined,
            }))
            .filter((subtask: Record<string, unknown>) => Boolean(subtask['title'] && (subtask['title'] as string).length > 0))
        : [],
    };
  }

  /**
   * Valide les données nettoyées
   */
  private validateTodoData(data: CreateTodoWithSubtasksRequest): boolean {
    return !!(data.title && data.subtasks.length > 0);
  }

  onCreateTodo(todoData: { title?: string; description?: string; subtasks?: { title?: string; description?: string }[] }) {
    const cleanData = this.sanitizeTodoData(todoData);

    if (!this.validateTodoData(cleanData)) {
      this.todoError = 'Données invalides: titre et sous-tâches requis';
      return;
    }

    this.isCreatingTodo = true;
    this.todoError = null;

    this.todolistService.createTodoWithSubtasks(cleanData).subscribe({
      next: () => {
        this.loadTodos();
        this.closeCreateModal();
      },
      error: () => {
        this.todoError = 'Erreur lors de la création de la tâche';
        this.isCreatingTodo = false;
      },
    });
  }

  onSubtaskUpdated(event: { subtaskId: string; updatedSubtask: TodoTask | Subtask }) {
    // Trouver la tâche parente qui contient cette sous-tâche
    this.todoItems.forEach(parentTask => {
      if (parentTask.subtasks) {
        const subtaskIndex = parentTask.subtasks.findIndex(st => st.id === event.subtaskId);
        if (subtaskIndex !== -1) {
          // Mettre à jour la sous-tâche
          parentTask.subtasks[subtaskIndex] = event.updatedSubtask as Subtask;

          // Recalculer les stats localement
          this.updateParentTaskStats(parentTask);
        }
      }
    });

    // Mettre à jour les statistiques globales
    this.todoStats = this.todolistService.calculateStats(this.todoItems);
  }

  private updateParentTaskStats(parentTask: TodoTask) {
    if (!parentTask.subtasks || parentTask.subtasks.length === 0) return;

    const totalSubtasks = parentTask.subtasks.length;
    const completedSubtasks = parentTask.subtasks.filter(st => st.status === 'completed').length;
    const pendingSubtasks = totalSubtasks - completedSubtasks;

    // Mettre à jour les statistics (nouvelle structure)
    parentTask.statistics = {
      total: totalSubtasks,
      completed: completedSubtasks,
      pending: pendingSubtasks,
      completionPercentage: Math.round((completedSubtasks / totalSubtasks) * 100),
    };

    // Calculer le pourcentage de complétion
    parentTask.completionPercentage = Math.round((completedSubtasks / totalSubtasks) * 100);

    // Déterminer le statut de la tâche parente
    if (completedSubtasks === 0) {
      parentTask.status = 'pending';
    } else if (completedSubtasks === totalSubtasks) {
      parentTask.status = 'completed';
    } else {
      parentTask.status = 'in_progress';
    }
  }

  get parentTasks(): TodoTask[] {
    if (!Array.isArray(this.todoItems)) return [];

    // Toutes les tâches retournées par l'API sont des tâches principales
    let tasks = this.todoItems;

    // Appliquer le filtre
    if (this.activeFilter !== 'all') {
      tasks = tasks.filter(task => task.status === this.activeFilter);
    }

    return tasks;
  }

  // Méthodes pour les filtres
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  setFilter(filter: 'all' | 'pending' | 'in_progress' | 'completed') {
    this.activeFilter = filter;
    this.showFilters = false;
  }

  getFilterIconName(): string {
    switch (this.activeFilter) {
      case 'pending':
        return 'clock';
      case 'in_progress':
        return 'zap';
      case 'completed':
        return 'check-circle';
      default:
        return 'clipboard';
    }
  }

  getFilterLabel(): string {
    switch (this.activeFilter) {
      case 'pending':
        return 'Pas commencé';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      default:
        return 'Toutes';
    }
  }

  getFilteredTasksCount(): number {
    return this.parentTasks.length;
  }

  getAllTasksCount(): number {
    return Array.isArray(this.todoItems) ? this.todoItems.length : 0;
  }

  getPendingTasksCount(): number {
    return Array.isArray(this.todoItems)
      ? this.todoItems.filter(t => t.status === 'pending').length
      : 0;
  }

  getInProgressTasksCount(): number {
    return Array.isArray(this.todoItems)
      ? this.todoItems.filter(t => t.status === 'in_progress').length
      : 0;
  }

  getCompletedTasksCount(): number {
    return Array.isArray(this.todoItems)
      ? this.todoItems.filter(t => t.status === 'completed').length
      : 0;
  }

  // Méthodes pour la semaine d'enseignement
  generateWeekView(): void {
    const startOfWeek = this.getStartOfWeek(this.currentWeek);
    this.weekDays = [];

    const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      this.weekDays.push({
        date: new Date(date),
        dayName: dayNames[i],
        dayNumber: date.getDate(),
        isToday: this.isSameDay(date, new Date()),
      });
    }
  }

  getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi

    // Convertir dimanche (0) en 7 pour le calcul
    const dayOfWeek = day === 0 ? 7 : day;

    // Calculer le nombre de jours à soustraire pour arriver au lundi (1)
    const daysToSubtract = dayOfWeek - 1;

    start.setDate(start.getDate() - daysToSubtract);
    start.setHours(0, 0, 0, 0);

    return start;
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  loadWeekCourses(): void {
    this.isLoadingWeekCourses = true;
    this.weekCoursesError = null;

    // Charger les cours pour la semaine actuelle
    const startDate = this.getStartOfWeek(this.currentWeek);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    // Appel filtré par plage de dates (fallback côté service si l’API ne le supporte pas)
    this.courseService.getCoursesByDateRange(startStr, endStr, undefined, 1, 500).subscribe({
      next: (courses) => {
        // Les cours sont déjà filtrés par la plage demandée
        this.weekCourses = courses;

        // Trier par jour puis par heure
        this.weekCourses.sort((a, b) => {
          const dateA = new Date(a.course_day || a.day || '');
          const dateB = new Date(b.course_day || b.day || '');
          
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA.getTime() - dateB.getTime();
          }

          return (a.course_start_hour || a.start_hour || '').localeCompare(b.course_start_hour || b.start_hour || '');
        });

        this.isLoadingWeekCourses = false;
      },
      error: () => {
        // console.error('Erreur lors du chargement des cours:', error);
        this.weekCoursesError = 'Impossible de charger les cours de la semaine';
        this.isLoadingWeekCourses = false;
      }
    });
  }

  getCoursesForDay(day: { date: Date }): Course[] {
    return this.weekCourses.filter(course => {
      const courseDay = course.course_day || course.day;
      if (!courseDay) return false;
      
      const courseDate = new Date(courseDay);
      return this.isSameDay(courseDate, day.date);
    });
  }

  formatTime(time: string): string {
    if (!time) return '';
    return time.substring(0, 5); // Afficher seulement HH:MM
  }

  getCourseColor(course: Course): string {
    return course.course_color || '#4fc3f7';
  }

  previousWeek(): void {
    this.currentWeek.setDate(this.currentWeek.getDate() - 7);
    this.generateWeekView();
    this.loadWeekCourses();
  }

  nextWeek(): void {
    this.currentWeek.setDate(this.currentWeek.getDate() + 7);
    this.generateWeekView();
    this.loadWeekCourses();
  }

  getWeekDisplay(): string {
    const startOfWeek = this.getStartOfWeek(this.currentWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startDay = startOfWeek.getDate();
    const startMonth = startOfWeek.toLocaleDateString('fr-FR', { month: 'short' });
    const endDay = endOfWeek.getDate();
    const endMonth = endOfWeek.toLocaleDateString('fr-FR', { month: 'short' });

    if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
      return `${startDay} - ${endDay} ${startMonth}`;
    } else {
      return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
    }
  }

  // Méthodes pour les modules de la journée
  loadTodayModules(): void {
    this.isLoadingTodayModules = true;
    this.todayModulesError = null;

    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // Appel filtré à la journée pour éviter de charger tous les cours
    this.courseService.getCoursesByDateRange(todayString, todayString, undefined, 1, 200).subscribe({
      next: (courses) => {
        this.todayModules = courses;

        // Trier par heure de début
        this.todayModules.sort((a, b) => {
          const timeA = a.course_start_hour || a.start_hour || '';
          const timeB = b.course_start_hour || b.start_hour || '';
          return timeA.localeCompare(timeB);
        });

        // Déterminer le module actuel et le prochain
        this.determineCurrentAndNextModule();

        this.isLoadingTodayModules = false;
      },
      error: () => {
        // console.error('Erreur lors du chargement des modules:', error);
        this.todayModulesError = 'Impossible de charger les modules du jour';
        this.isLoadingTodayModules = false;
      }
    });
  }

  determineCurrentAndNextModule(): void {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes depuis minuit

    this.currentModule = null;
    this.nextModule = null;

    for (const module of this.todayModules) {
      const startTime = this.timeToMinutes(module.course_start_hour || module.start_hour || '');
      const endTime = this.timeToMinutes(module.course_end_hour || module.end_hour || '');

      if (currentTime >= startTime && currentTime <= endTime) {
        this.currentModule = module;
        break;
      } else if (currentTime < startTime && !this.nextModule) {
        this.nextModule = module;
      }
    }

    // Ne pas afficher de "prochain module" si tous les modules du jour sont passés
    // On garde nextModule à null dans ce cas pour éviter l'affichage trompeur
  }

  timeToMinutes(time: string): number {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  isModuleAttendanceDone(module: Course): boolean {
    // Pris si le backend a marqué attendance_taken, ou fallback sur ancien flag
    return Boolean(module?.attendance_taken || (module as unknown as Record<string, unknown>)['attendance_done']);
  }

  openAttendanceModal(module: Course): void {
    if (!module) return;
    const courseId = module.course_uuid || module.course_id || module.id;
    if (!courseId) return;
    this.showAttendanceModal = true;
    this.attendanceState = 'loading';
    this.attendanceError = '';
    this.attendanceService.getCourseAttendanceNew(courseId as string).subscribe({
      next: (res) => {
        this.attendanceData = res as { course_uuid: string; students: Student[]; attendance_taken?: boolean };
        this.attendanceForm = (((res as unknown as Record<string, unknown>)['students'] as Student[])||[]).map((s: Student)=>({student_uuid: s.student_uuid, status: ((s as unknown as Record<string, unknown>)['status'] as 'present'|'absent'|'justified') || 'present'}));
        this.attendanceState = 'ready';
      },
      error: (err: Error & { error?: { message?: string } }) => { this.attendanceState='error'; this.attendanceError = err?.error?.message || 'Erreur de chargement'; }
    });
  }

  closeAttendanceModal(): void {
    this.showAttendanceModal = false;
    this.attendanceData = null;
    this.attendanceForm = [];
    this.attendanceError = '';
  }

  markAllAttendance(status: 'present'|'absent'|'justified'){
    this.attendanceForm = this.attendanceForm.map(s=>({...s,status}));
  }

  submitAttendance(){
    if(!this.attendanceData) return;
    const body = { students: this.attendanceForm };
    this.isSavingAttendance = true;
    this.attendanceService.submitCourseAttendance(this.attendanceData.course_uuid, body).subscribe({
      next: () => { this.isSavingAttendance=false; this.closeAttendanceModal(); this.loadTodayModules(); },
      error: (err: Error & { error?: { message?: string } }) => { this.isSavingAttendance=false; this.attendanceError = err?.error?.message || 'Erreur lors de la validation'; }
    });
  }

  // Hooks liés à l’ancienne modale retirés

  formatModuleTime(module: Course): string {
    if (!module) return '';
    
    const startTime = this.formatTime(module.course_start_hour || module.start_hour || '');
    const endTime = this.formatTime(module.course_end_hour || module.end_hour || '');
    return `${startTime} - ${endTime}`;
  }

  formatModuleDate(module: Course): string {
    if (!module) return '';
    
    const date = new Date(module.course_day || module.day || '');
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }


}
