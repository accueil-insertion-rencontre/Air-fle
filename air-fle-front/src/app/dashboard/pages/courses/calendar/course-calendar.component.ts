import {
  AlertService,
  AttendanceService,
  AuthService,
  CourseService,
  GroupService,
  SessionService,
  UserService,
} from '@core/services';

import { Course, Group, Session, Student, UserDisplayInfo } from '@core/models';

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';

interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
}

@Component({
  selector: 'app-course-calendar',
  templateUrl: './course-calendar.component.html',
  styleUrls: ['./course-calendar.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class CourseCalendarComponent implements OnInit {
  currentWeek = new Date();
  weekDays: WeekDay[] = [];
  sessions: Session[] = [];
  groups: Group[] = [];
  teachers: UserDisplayInfo[] = [];
  selectedSessionId: string | number | null = null;
  courses: Course[] = [];

  // Modal properties (custom)
  courseForm: FormGroup;
  showCreateModal = false;
  selectedDate: string = '';
  loading = false;
  error = '';
  // Gestion des présences (copiée exactement de la modal d'absences)
  students: Student[] = [];
  studentAttendances: {
    student: Student;
    status: 'present' | 'absent' | 'absent_justified' | 'late';
    originalStatus?: 'present' | 'absent' | 'absent_justified' | 'late';
    reason?: string;
  }[] = [];
  isLoadingStudents = false;
  isSaving = false;

  // Propriétés pour le modal de détail de cours (custom)
  showDetailsModal = false;
  selectedCourse: Course | null = null;
  courseStudents: Student[] = [];
  loadingCourseDetails = false;
  // Suppression
  showDeleteConfirm = false;
  courseToDeleteId: string | number | null = null;
  deleteLoading = false;
  deleteError = '';


  // Propriétés pour le modal d'édition de cours (custom)
  showEditModal = false;
  editCourseForm: FormGroup;
  editLoading = false;
  editError = '';

  // Propriétés pour la création multi-dates
  isMultiDateMode = false;
  selectedDates: string[] = [];
  recurrenceType: 'none' | 'weekly' | 'custom' = 'none';
  weeklyOccurrences = 1;
  maxWeeklyOccurrences = 10;

  // Hours for time selection in modal
  timeOptions = [
    '00:00',
    '00:30',
    '01:00',
    '01:30',
    '02:00',
    '02:30',
    '03:00',
    '03:30',
    '04:00',
    '04:30',
    '05:00',
    '05:30',
    '06:00',
    '06:30',
    '07:00',
    '07:30',
    '08:00',
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
    '17:30',
    '18:00',
    '18:30',
    '19:00',
    '19:30',
    '20:00',
    '20:30',
    '21:00',
    '21:30',
    '22:00',
    '22:30',
    '23:00',
    '23:30',
  ];

  // Couleurs pour les cours
  courseColors = [
    '#007bff',
    '#28a745',
    '#dc3545',
    '#ffc107',
    '#6f42c1',
    '#e83e8c',
    '#20c997',
    '#fd7e14',
    '#6610f2',
    '#17a2b8',
  ];

  // Couleurs prédéfinies pour la sélection utilisateur
  predefinedColors = [
    { name: 'Bleu', value: '#007bff' },
    { name: 'Vert', value: '#28a745' },
    { name: 'Rouge', value: '#dc3545' },
    { name: 'Jaune', value: '#ffc107' },
    { name: 'Violet', value: '#6f42c1' },
    { name: 'Rose', value: '#e83e8c' },
    { name: 'Turquoise', value: '#20c997' },
    { name: 'Orange', value: '#fd7e14' },
    { name: 'Indigo', value: '#6610f2' },
    { name: 'Cyan', value: '#17a2b8' },
    { name: 'Gris', value: '#6c757d' },
    { name: 'Sombre', value: '#343a40' },
  ];

  // Cache pour éviter les appels répétés
  private coursesCache = new Map<string, Course[]>();
  private lastCoursesUpdate = 0;

  constructor(
    private courseService: CourseService,
    private sessionService: SessionService,
    private groupService: GroupService,
    private userService: UserService,
    private attendanceService: AttendanceService,
    private alertService: AlertService,
    private authService: AuthService,
    private formBuilder: FormBuilder
  ) {
    // Initialiser les formulaires
    this.courseForm = this.formBuilder.group({
      course_name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      course_description: ['', [Validators.maxLength(500)]],
      course_start_hour: ['', Validators.required],
      course_end_hour: ['', Validators.required],
      course_room: ['', [Validators.required, Validators.maxLength(100)]],
      course_color: ['#4fc3f7', Validators.required],
      group_uuid: [null, Validators.required],
      user_uuid: [''], // Optionnel
      course_date: ['', Validators.required],
    });

    this.editCourseForm = this.formBuilder.group({
      course_name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      course_description: ['', [Validators.maxLength(500)]],
      course_start_hour: ['', Validators.required],
      course_end_hour: ['', Validators.required],
      course_room: ['', [Validators.required, Validators.maxLength(100)]],
      course_color: ['#4fc3f7', Validators.required],
      group_uuid: [null, Validators.required],
      user_uuid: [null, Validators.required],
      day: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadSessions();
    this.loadTeachers();
    this.generateWeekView();
    this.loadCourses();
  }

  /**
   * Charge les sessions disponibles
   */
  loadSessions(): void {
    this.sessionService.getSessions().subscribe({
      next: sessions => {
        this.sessions = sessions;

        // Extraire tous les groupes de toutes les sessions
        this.groups = [];
        sessions.forEach(session => {
          if (session.groups) {
            session.groups.forEach(group => {
              this.groups.push({
                ...group,
                session: session,
              });
            });
          }
        });

        // Sélectionner automatiquement la première session pour le filtrage
        if (sessions.length > 0) {
          this.selectedSessionId = sessions[0].session_uuid || sessions[0].id || null;
          this.loadCourses();
        }
      },
      error: () => {
        this.error = 'Impossible de charger les sessions';
      },
    });
  }

  /**
   * Charge les professeurs disponibles
   */
  loadTeachers(): void {
    this.userService.getTeachers().subscribe({
      next: teachers => {
        this.teachers = teachers;
      },
      error: () => {
        this.error = 'Impossible de charger les professeurs';
      }
    });
  }

  /**
   * Génère la vue hebdomadaire
   */
  generateWeekView(): void {
    const startOfWeek = this.getStartOfWeek(this.currentWeek);
    this.weekDays = [];

    const today = new Date();
    const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      this.weekDays.push({
        date: new Date(date),
        dayName: dayNames[i],
        dayNumber: date.getDate(),
        isToday: this.isSameDay(date, today),
      });
    }
  }

  /**
   * Retourne le début de la semaine (lundi)
   */
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

  /**
   * Vérifie si deux dates sont le même jour
   */
  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Charge TOUS les cours puis filtre côté frontend
   */
  loadCourses(): void {

    // 🌐 Appel API filtré par plage (semaine courante) pour éviter de charger tout
    const start = this.getStartOfWeek(this.currentWeek);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const startStr = this.formatDateForApi(start);
    const endStr = this.formatDateForApi(end);

    this.courseService.getCoursesByDateRange(startStr, endStr, this.selectedSessionId || undefined, 1, 500).subscribe({
      next: allCourses => {
        // Les cours sont déjà filtrés par la plage et la session éventuelle
        this.courses = allCourses;

        // Vider le cache et mettre à jour le timestamp
        this.clearCoursesCache();
        
        this.updateScheduleWithCourses();
      },
      error: (error) => {
        // console.error('❌ === ERREUR loadCourses() ===');
        // console.error('❌ Erreur lors du chargement des cours:', error);
        // console.error('❌ Status code:', error.status);
        // console.error('❌ Message:', error.message);
        this.error = 'Impossible de charger les cours';
        this.courses = [];
        this.clearCoursesCache();
        this.updateScheduleWithCourses();
      },
    });
  }

  /**
   * Met à jour le planning avec les cours chargés
   */
  updateScheduleWithCourses(): void {
    // Plus besoin de logique complexe avec le nouveau design par colonnes
  }

  /**
   * Formate une date pour l'API (YYYY-MM-DD) sans décalage UTC
   */
  formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Navigation du planning
   */
  previousWeek(): void {
    const newWeek = new Date(this.currentWeek);
    newWeek.setDate(this.currentWeek.getDate() - 7);
    this.currentWeek = newWeek;
    this.generateWeekView();
    this.loadCourses();
  }

  nextWeek(): void {
    const newWeek = new Date(this.currentWeek);
    newWeek.setDate(this.currentWeek.getDate() + 7);
    this.currentWeek = newWeek;
    this.generateWeekView();
    this.loadCourses();
  }

  /**
   * Gestion du changement de session pour le filtrage
   */
  onSessionChange(sessionId: string | number | null): void {
    this.selectedSessionId = sessionId;
    this.loadCourses();
  }

  /**
   * Gestion du clic sur un jour (remplace onTimeSlotClick)
   */
  onDayClick(day: WeekDay): void {
    this.selectedDate = this.formatDateForApi(day.date);
    this.selectedDates = [this.selectedDate];
    this.isMultiDateMode = false;
    this.openCreateCourseModal();
  }

  /**
   * Récupère les cours pour un jour donné
   */
  getCoursesForDay(day: WeekDay): Course[] {
    const dateKey = this.formatDateForApi(day.date);
    
    // Vérifier le cache si les données n'ont pas changé
    const cacheKey = `${dateKey}-${this.courses.length}-${this.lastCoursesUpdate}`;
    if (this.coursesCache.has(cacheKey)) {
      return this.coursesCache.get(cacheKey)!;
    }
    
    const daysCourses = this.courses.filter(course => {
      const courseDate = course.course_day || course.day;
      
      return courseDate === dateKey;
    });

    // Enrichir chaque cours avec les données complètes
    const enrichedCourses = daysCourses.map(course => this.enrichCourseData(course));

    // Trier les cours par heure de début, puis par date de création
    const sortedCourses = enrichedCourses.sort((a, b) => {
      // Première priorité : trier par heure de début (plus tôt en premier)
      const startHourA = a.course_start_hour || a.start_hour;
      const startHourB = b.course_start_hour || b.start_hour;
      
      if (startHourA && startHourB) {
        const timeComparison = startHourA.localeCompare(startHourB);
        if (timeComparison !== 0) {
          return timeComparison;
        }
      }

      // Deuxième priorité : trier par date de création (plus ancien en premier)
      if (a.created_at && b.created_at) {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateA.getTime() - dateB.getTime();
      }

      // Si pas de date de création, utiliser l'ID comme fallback
      const idA = a.course_uuid || a.course_id || 0;
      const idB = b.course_uuid || b.course_id || 0;
      return idA.toString().localeCompare(idB.toString());
    });

    // Mettre en cache
    this.coursesCache.set(cacheKey, sortedCourses);

    return sortedCourses;
  }

  /**
   * Génère une couleur pour un cours basée sur sa couleur personnalisée ou son groupe
   */
  getCourseColor(course: Course): string {
    // Priorité 1: Couleur personnalisée du cours
    if (course.course_color) {
      return course.course_color;
    }

    // Priorité 2: Couleur basée sur le groupe (fallback)
    if (!course.group_uuid) {
      return this.courseColors[0];
    }

    // S'assurer qu'on travaille avec une string
    const groupIdStr = course.group_uuid.toString();

    // Utiliser le hash du group_uuid pour avoir une couleur consistante
    let hash = 0;
    for (let i = 0; i < groupIdStr.length; i++) {
      const char = groupIdStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convertit en entier 32-bit
    }

    // S'assurer que le hash est positif
    const positiveHash = Math.abs(hash);

    // Sélectionner une couleur basée sur le hash
    const colorIndex = positiveHash % this.courseColors.length;
    return this.courseColors[colorIndex];
  }

  /**
   * Génère une couleur avec opacité pour le background de la carte
   */
  getCourseColorWithOpacity(course: Course): string {
    const originalColor = this.getCourseColor(course);
    return this.hexToRgba(originalColor, 0.4);
  }

  /**
   * Convertit une couleur hex en rgba avec opacité
   */
  private hexToRgba(hex: string, opacity: number): string {
    // Enlever le # si présent
    hex = hex.replace('#', '');

    // Convertir en RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  /**
   * TrackBy function pour optimiser le rendu des options
   */
  trackByGroupId(index: number, group: Group): string {
    return (group.group_uuid || group.group_id || group.id || index.toString()).toString();
  }

  /**
   * Bascule le mode multi-dates
   */
  toggleMultiDateMode(): void {
    this.isMultiDateMode = !this.isMultiDateMode;

    if (this.isMultiDateMode) {
      this.courseForm.patchValue({
        is_multi_date: true,
        recurrence_type: this.recurrenceType,
        custom_dates: this.selectedDates,
      });
    } else {
      this.courseForm.patchValue({
        is_multi_date: false,
        recurrence_type: 'none',
        custom_dates: [this.selectedDate],
      });
      this.selectedDates = [this.selectedDate];
    }
  }

  /**
   * Change le type de récurrence
   */
  onRecurrenceTypeChange(type: 'none' | 'weekly' | 'custom'): void {
    this.recurrenceType = type;

    if (type === 'weekly') {
      this.generateWeeklyDates();
    } else if (type === 'custom') {
      this.selectedDates = [this.selectedDate];
    } else {
      this.selectedDates = [this.selectedDate];
    }

    this.courseForm.patchValue({
      recurrence_type: type,
      custom_dates: this.selectedDates,
    });
  }

  /**
   * Génère les dates pour la récurrence hebdomadaire
   */
  generateWeeklyDates(): void {
    this.selectedDates = [];
    const startDate = new Date(this.selectedDate);

    for (let i = 0; i < this.weeklyOccurrences; i++) {
      const newDate = new Date(startDate);
      newDate.setDate(startDate.getDate() + i * 7);
      this.selectedDates.push(this.formatDateForApi(newDate));
    }

    this.courseForm.patchValue({
      custom_dates: this.selectedDates,
    });
  }

  /**
   * Change le nombre d'occurrences hebdomadaires
   */
  onWeeklyOccurrencesChange(occurrences: number): void {
    this.weeklyOccurrences = Math.max(1, Math.min(occurrences, this.maxWeeklyOccurrences));

    if (this.recurrenceType === 'weekly') {
      this.generateWeeklyDates();
    }

    this.courseForm.patchValue({
      weekly_occurrences: this.weeklyOccurrences,
    });
  }

  /**
   * Ajoute une date personnalisée
   */
  addCustomDate(dateString: string): void {
    if (dateString && !this.selectedDates.includes(dateString)) {
      this.selectedDates.push(dateString);
      this.selectedDates.sort(); // Trier les dates

      this.courseForm.patchValue({
        custom_dates: this.selectedDates,
      });
    }
  }

  /**
   * Supprime une date personnalisée
   */
  removeCustomDate(dateString: string): void {
    const index = this.selectedDates.indexOf(dateString);
    if (index > -1) {
      this.selectedDates.splice(index, 1);

      this.courseForm.patchValue({
        custom_dates: this.selectedDates,
      });
    }
  }

  /**
   * Formate une date pour l'affichage utilisateur
   */
  formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Soumet le formulaire de création de cours
   */
  onSubmitCourse(): void {
    if (this.courseForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    const baseCourseData: Partial<Course> = {
      course_name: this.courseForm.value.course_name,
      course_start_hour: this.courseForm.value.course_start_hour,
      course_end_hour: this.courseForm.value.course_end_hour,
      group_uuid: this.courseForm.value.group_uuid,
      user_uuid: this.courseForm.value.user_uuid,
      course_color: this.courseForm.value.course_color,
      course_day: this.selectedDate, // Ajouter course_day qui est requis
    };

    // Déterminer les dates à créer
    const datesToCreate = this.isMultiDateMode ? this.selectedDates : [this.selectedDate];

    // Créer les cours pour chaque date
    this.createCoursesForDates(baseCourseData, datesToCreate);
  }

  /**
   * Crée les cours pour toutes les dates sélectionnées
   */
  private createCoursesForDates(baseCourseData: Partial<Course>, dates: string[]): void {
    const courseCreationPromises: Promise<Course>[] = [];

    dates.forEach(date => {
      // Convertir les heures en objets Date avec la date du cours
      // Utiliser l'heure locale pour éviter les décalages de timezone
      const startDate = new Date(`${date}T${baseCourseData.course_start_hour}:00`);
      const endDate = new Date(`${date}T${baseCourseData.course_end_hour}:00`);
      
      // Ajuster pour que l'heure soit interprétée comme locale
      const startDateLocal = new Date(startDate.getTime() - (startDate.getTimezoneOffset() * 60000));
      const endDateLocal = new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000));
      
      const courseData: Partial<Course> = {
        ...baseCourseData,
        course_day: date,
        course_start_hour: startDateLocal.toISOString(),
        course_end_hour: endDateLocal.toISOString(),
      };

      // Debug: Afficher les données envoyées

      const promise = new Promise<Course>((resolve, reject) => {
        this.courseService.createCourse(courseData).subscribe({
          next: course => {
            resolve(course);
          },
          error: (error) => {
            // console.error('❌ Erreur API lors de la création:', error);
            // console.error('❌ Détails de l\'erreur:', {
            //   status: error.status,
            //   message: error.message,
            //   error: error.error
            // });
            reject(error);
          },
        });
      });

      courseCreationPromises.push(promise);
    });

    // Attendre que tous les cours soient créés
    Promise.allSettled(courseCreationPromises)
      .then(results => {
        this.loading = false;

        const failed = results.filter(result => result.status === 'rejected');
        const successCount = results.filter(result => result.status === 'fulfilled').length;

        if (failed.length > 0) {
          // console.error('Failed to create some courses', failed);
        }

        if (successCount > 0) {
          const message =
            dates.length === 1
              ? 'Cours créé avec succès !'
              : `${successCount} cours créés avec succès${failed.length > 0 ? `, ${failed.length} échecs` : ''} !`;

          this.alertService.success(message);
          this.showCreateModal = false;

          // Recharger le planning pour afficher les nouveaux cours
          this.loadCourses();

          // Réinitialiser le formulaire
          this.resetCourseForm();
        }

        if (failed.length > 0) {
          this.error = 'Erreur lors de la création des cours';
        }
      })
      .catch(error => {
        this.loading = false;
        // console.error('💥 Erreur globale:', error);
        this.error = 'Une erreur est survenue lors de la création des cours';
      });
  }

  /**
   * 🔧 FIX: Convertit une heure string "HH:MM" en objet Date
   */
  private convertTimeToDate(timeString: string): Date {
    if (!timeString) return new Date();
    
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Réinitialise le formulaire de cours
   */
  private resetCourseForm(): void {
    this.courseForm.reset({
      group_uuid: '',
      course_name: '',
      course_start_hour: '09:00', // Heure par défaut
      course_end_hour: '10:00', // Heure par défaut
      user_uuid: '',
      course_color: '',
      is_multi_date: false,
      recurrence_type: 'none',
      weekly_occurrences: 1,
      custom_dates: [this.selectedDate],
    });

    // Réinitialiser les états
    this.isMultiDateMode = false;
    this.selectedDates = [this.selectedDate];
    this.recurrenceType = 'none';
    this.weeklyOccurrences = 1;
    this.error = '';
  }

  // ========== MÉTHODES POUR LE MODAL DE DÉTAIL DE COURS ==========

  /**
   * Sélectionne un cours pour afficher ses détails
   */
  selectCourse(course: Course): void {
    this.selectedCourse = this.enrichCourseData(course);
    this.loadCourseStudents();

    // Ouvrir le modal de détail
    this.showDetailsModal = true;
  }

  /**
   * Enrichit les données d'un cours avec les informations complètes du groupe et de la session
   */
  private enrichCourseData(course: Course): Course {
    // Trouver le groupe complet correspondant
    const fullGroup = this.groups.find(
      g => g.group_uuid === course.group_uuid || g.group_id === course.group_id
    );

    // Récupérer la session à partir du groupe (relation: Cours → Groupe → Session)
    let fullSession = null;
    if (fullGroup) {
      if (fullGroup.session) {
        fullSession = fullGroup.session;
      } else if (fullGroup.session_uuid || fullGroup.session_id) {
        // Chercher la session complète par son ID
        fullSession = this.sessions.find(
          s => s.session_uuid === fullGroup.session_uuid || s.id === fullGroup.session_id
        );
      }
    }

    // Extraire l'user_uuid depuis l'array users de l'API
    let assignedUserUuid = course.user?.user_uuid || course.user_uuid; // Valeur par défaut

    // Si le cours a un array users (structure API), extraire le premier professeur
    const courseWithUsers = course as Course & { users?: UserDisplayInfo[] };
    if (
      courseWithUsers.users &&
      Array.isArray(courseWithUsers.users) &&
      courseWithUsers.users.length > 0
    ) {
      const firstUser = courseWithUsers.users[0];
      if (firstUser && firstUser.user_uuid) {
        assignedUserUuid = firstUser.user_uuid;
      } else if (firstUser && (firstUser as unknown as Record<string, unknown>)['user'] && ((firstUser as unknown as Record<string, unknown>)['user'] as Record<string, unknown>)['user_uuid']) {
        assignedUserUuid = ((firstUser as unknown as Record<string, unknown>)['user'] as Record<string, unknown>)['user_uuid'] as string;
      }
    }

    // Enrichir avec les données complètes du professeur
    let fullUser = undefined;
    if (assignedUserUuid) {
      const teacher = this.getTeacherById(assignedUserUuid);
      if (teacher) {
        fullUser = {
          user_uuid: teacher.user_uuid,
          user_firstname: teacher.user_firstname,
          user_lastname: teacher.user_lastname,
          user_mail: teacher.user_mail,
          user_id: teacher.user_uuid || teacher.id,
          firstname: teacher.firstname,
          lastname: teacher.lastname,
          email: teacher.email,
        };
      }
    }

    return {
      ...course,
      user_uuid: assignedUserUuid, // Assigner l'user_uuid extrait
      user: fullUser, // Ajouter les données complètes du professeur
      group: fullGroup
        ? {
            group_uuid: fullGroup.group_uuid,
            group_id: fullGroup.group_id,
            group_label: fullGroup.group_label || fullGroup.label,
            label: fullGroup.group_label || fullGroup.label,
          }
        : course.group,
      session: fullSession
        ? {
            session_uuid: fullSession.session_uuid || fullSession.id,
            session_label: fullSession.session_label || fullSession.label,
            session_id: fullSession.session_uuid || fullSession.id,
            label: fullSession.session_label || fullSession.label,
          }
        : course.session,
    };
  }

  /**
   * Charge les élèves du groupe associé au cours
   */
  loadCourseStudents(): void {
    if (!this.selectedCourse?.group_uuid) {
      this.error = 'Aucun groupe associé à ce cours';
      return;
    }

    this.isLoadingStudents = true;
    this.error = '';

    // Charger le groupe pour récupérer les étudiants
    this.groupService.getGroupById(this.selectedCourse.group_uuid).subscribe({
      next: (group: Group) => {
        this.students = group.students || [];
        this.courseStudents = this.students; // Garder la compatibilité
        
        // Mettre à jour les informations du groupe dans le cours
        this.selectedCourse!.group = {
          group_uuid: group.group_uuid || String(group.group_id),
          group_label: (group as unknown as Record<string, unknown>)['group_name'] as string || group.label || (group as unknown as Record<string, unknown>)['name'] as string
        };
        
        this.initializeAttendances();
        this.loadExistingAbsences();
        this.isLoadingStudents = false;
      },
      error: (error: Error) => {
        // console.error('Erreur lors du chargement des étudiants:', error);
        this.error = 'Impossible de charger les étudiants du groupe';
        this.isLoadingStudents = false;
      }
    });
  }

  /**
   * Initialise les présences (copié exactement de la modal d'absences)
   */
  initializeAttendances(): void {
    this.studentAttendances = this.students.map(student => ({
      student,
      status: 'present' as const,
      originalStatus: 'present' as const
    }));
  }

  /**
   * Charge les absences existantes (copié exactement de la modal d'absences)
   */
  loadExistingAbsences(): void {
    if (!this.selectedCourse?.course_uuid) return;

    // Charger les absences existantes pour ce cours
    this.attendanceService.getCourseAbsences(this.selectedCourse.course_uuid).subscribe({
      next: (absences) => {
        
        // Pour chaque absence trouvée, marquer l'étudiant selon le type d'absence
        absences.forEach(absence => {
          const attendance = this.studentAttendances.find(
            a => a.student.student_uuid === absence.student_uuid || a.student.student_uuid === absence.student_id
          );
          if (attendance) {
            // Si l'absence a une raison, c'est "absent_justified", sinon "absent"
            if (absence.absence_reason && absence.absence_reason.trim() !== '') {
              attendance.status = 'absent_justified';
              attendance.originalStatus = 'absent_justified';
              attendance.reason = absence.absence_reason;
            } else {
              attendance.status = 'absent';
              attendance.originalStatus = 'absent';
            }
          }
        });
      },
      error: (error: Error) => {
        // console.error('Erreur lors du chargement des absences:', error);
      }
    });
  }

  /**
   * Ferme le modal de détail
   */
  onCloseDetailsModal(): void {
    this.selectedCourse = null;
    this.courseStudents = [];
    this.studentAttendances = [];
    this.showDetailsModal = false;
  }

  /**
   * Bouton "Modifier le cours"
   */
  onEditCourse(): void {
    if (!this.selectedCourse) return;

    this.editCourseForm.patchValue({
      course_name: this.selectedCourse.course_name || this.selectedCourse.title || this.selectedCourse.intitule,
      course_start_hour: this.selectedCourse.course_start_hour || this.selectedCourse.course_start_hour || this.selectedCourse.start_hour,
      course_end_hour: this.selectedCourse.course_end_hour || this.selectedCourse.course_end_hour || this.selectedCourse.end_hour,
      course_color: this.selectedCourse.course_color || this.selectedCourse.course_color || this.selectedCourse.color,
    });

    this.showDetailsModal = false;

    // Ouvrir le modal d'édition
    setTimeout(() => { this.showEditModal = true; }, 150);
  }

  /**
   * Bouton "Supprimer le cours"
   */
  onDeleteCourse(): void {
    if (!this.selectedCourse) return;
    const courseId = this.selectedCourse.course_uuid || this.selectedCourse.id;
    if (!courseId) return;
    this.courseToDeleteId = courseId;
    this.deleteError = '';
    this.showDeleteConfirm = true;
  }

  confirmDeleteCourse(): void {
    if (!this.courseToDeleteId) return;
    this.deleteLoading = true;
    this.deleteError = '';
    this.courseService.deleteCourse(this.courseToDeleteId).subscribe({
      next: () => {
        this.deleteLoading = false;
        this.showDeleteConfirm = false;
        this.onCloseDetailsModal();
        this.loadCourses();
        this.alertService.success('Cours supprimé avec succès');
      },
      error: (error) => {
        this.deleteLoading = false;
        this.deleteError = error?.error?.message || 'Erreur lors de la suppression du cours';
      }
    });
  }

  cancelDeleteCourse(): void {
    this.showDeleteConfirm = false;
    this.deleteLoading = false;
    this.deleteError = '';
    this.courseToDeleteId = null;
  }

  // ========== MÉTHODES POUR LA GESTION DES PRÉSENCES ==========

  /**
   * Obtient l'identifiant de l'étudiant (student_uuid ou id selon l'API)
   */
  private getStudentKey(student: Student): number | string {
    return student.student_uuid || student.student_uuid || 0;
  }

  /**
   * TrackBy function pour optimiser le rendu des étudiants
   */
  trackByStudentId = (index: number, student: Student): number | string => {
    return student.student_uuid || student.student_uuid || index;
  };

  /**
   * Marque un élève comme présent
   */
  setStudentStatus(studentUuid: string, status: 'present' | 'absent' | 'absent_justified'): void {
    const attendance = this.studentAttendances.find(a => a.student.student_uuid === studentUuid);
    if (attendance) {
      attendance.status = status;
    }
  }

  getStudentStatus(studentUuid: string): 'present' | 'absent' | 'absent_justified' | 'late' | 'unknown' {
    const attendance = this.studentAttendances.find(a => a.student.student_uuid === studentUuid);
    return (attendance?.status || 'unknown') as 'present' | 'absent' | 'absent_justified' | 'late' | 'unknown';
  }

  markStudentPresent(student: Student): void {
    this.setStudentStatus(student.student_uuid, 'present');
  }

  markStudentAbsent(student: Student): void {
    this.setStudentStatus(student.student_uuid, 'absent');
  }

  markStudentAbsentJustified(student: Student): void {
    this.setStudentStatus(student.student_uuid, 'absent_justified');
  }

  /**
   * Vérifie si un élève est marqué présent
   */
  isStudentPresent(student: Student): boolean {
    return this.getStudentStatus(student.student_uuid) === 'present';
  }

  isStudentAbsent(student: Student): boolean {
    return this.getStudentStatus(student.student_uuid) === 'absent';
  }

  isStudentAbsentJustified(student: Student): boolean {
    return this.getStudentStatus(student.student_uuid) === 'absent_justified';
  }

  /**
   * Retourne le libellé du statut d'un élève
   */
  getStudentStatusLabel(student: Student): string {
    const status = this.getStudentStatus(student.student_uuid);
    switch (status) {
      case 'present':
        return 'Présent';
      case 'absent':
        return 'Absent';
      case 'absent_justified':
        return 'Absent avec justification';
      default:
        return 'Non défini';
    }
  }

  getStudentStatusBadgeClass(student: Student): string {
    const status = this.getStudentStatus(student.student_uuid);
    switch (status) {
      case 'present':
        return 'badge bg-success';
      case 'absent':
        return 'badge bg-danger';
      case 'absent_justified':
        return 'badge bg-warning';
      default:
        return 'badge bg-secondary';
    }
  }

  getStudentStatusIcon(student: Student): string {
    const status = this.getStudentStatus(student.student_uuid);
    switch (status) {
      case 'present':
        return 'fas fa-check';
      case 'absent':
        return 'fas fa-times';
      case 'absent_justified':
        return 'fas fa-exclamation-triangle';
      default:
        return 'fas fa-question';
    }
  }

  /**
   * Compte le nombre d'élèves présents
   */
  getPresentStudentsCount(): number {
    return this.studentAttendances.filter(a => a.status === 'present').length;
  }

  getAbsentStudentsCount(): number {
    return this.studentAttendances.filter(a => a.status === 'absent').length;
  }

  getAbsentJustifiedStudentsCount(): number {
    return this.studentAttendances.filter(a => a.status === 'absent_justified').length;
  }

  // ========== MÉTHODES POUR LE MODAL D'ÉDITION DE COURS ==========

  /**
   * Soumet le formulaire d'édition de cours
   */
  onSubmitEditCourse(): void {
    if (this.editCourseForm.invalid) {
      return;
    }

    this.editLoading = true;
    this.editError = '';

    const courseData = {
      course_name: this.editCourseForm.value.course_name,
      course_start_hour: this.editCourseForm.value.course_start_hour,
      course_end_hour: this.editCourseForm.value.course_end_hour,
      group_uuid: this.editCourseForm.value.group_uuid,
      user_uuid: this.editCourseForm.value.user_uuid,
      course_color: this.editCourseForm.value.course_color,
    };

    const courseId = this.selectedCourse?.course_uuid || this.selectedCourse?.id;
    if (!courseId) {
      this.editLoading = false;
      return;
    }

    this.courseService.updateCourse(courseId, courseData).subscribe({
      next: () => {
        this.loadCourses();
        this.onCancelEditCourse();
              this.editLoading = false;
      },
      error: () => {
        this.editError = 'Erreur lors de la modification du cours';
              this.editLoading = false;
      }
    });
  }

  /**
   * Annule l'édition de cours
   */
  onCancelEditCourse(): void {
    this.editCourseForm.reset();
    this.editError = '';
    this.showEditModal = false;
  }

  /**
   * Vérifie si un champ du formulaire d'édition est invalide
   */
  isEditFieldInvalid(fieldName: string): boolean {
    const control = this.editCourseForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  /**
   * Récupère les informations d'un professeur par son ID
   */
  getTeacherById(teacherId: string | number | null | undefined): UserDisplayInfo | null {
    if (!teacherId) return null;

    return this.teachers.find(teacher => teacher.id?.toString() === teacherId.toString()) || null;
  }

  /**
   * Retourne le nom complet d'un professeur ou 'Non assigné'
   */
  getTeacherFullName(teacherId: string | number | null | undefined): string {
    const teacher = this.getTeacherById(teacherId);
    return teacher ? teacher.fullName : 'Non assigné';
  }

  /**
   * Sauvegarde toutes les présences (copié exactement de la modal d'absences)
   */
  saveAllAttendances(): void {
    if (!this.selectedCourse?.course_uuid) {
      this.alertService.error('Aucun cours sélectionné');
      return;
    }

    this.isSaving = true;

    // Créer les absences pour les étudiants marqués comme absents
    const courseUuid = this.selectedCourse!.course_uuid;
    const absencesToCreate = this.studentAttendances
      .filter(attendance => attendance.status === 'absent' || attendance.status === 'absent_justified')
      .map(attendance => ({
        student_uuid: attendance.student.student_uuid,
        course_uuid: courseUuid,
        absence_reason: attendance.status === 'absent_justified' ? 
          (attendance.reason || 'Absence justifiée') : undefined
      }));

    if (absencesToCreate.length === 0) {
      this.alertService.success('Tous les étudiants sont présents !');
      this.isSaving = false;
      return;
    }

    // Créer toutes les absences
    Promise.allSettled(
      absencesToCreate.map(absenceData => 
        this.attendanceService.createAbsence(absenceData).toPromise()
      )
    )
      .then(results => {
        this.isSaving = false;

        const failed = results.filter(result => result.status === 'rejected');

        if (failed.length > 0) {
          // console.error('Erreurs lors de la sauvegarde:', failed);
          this.alertService.error(`${failed.length} absence(s) n'ont pas pu être enregistrées`);
        } else {
          this.alertService.success('Présences enregistrées avec succès !');
        }
      })
      .catch(error => {
        this.isSaving = false;
        // console.error('Erreur lors de la sauvegarde:', error);
        this.alertService.error('Erreur lors de l\'enregistrement des présences');
      });
  }

  /**
   * Marque tous les élèves comme présents
   */
  markAllStudentsPresent(): void {
    this.studentAttendances.forEach(attendance => {
      attendance.status = 'present';
    });
  }

  markAllStudentsAbsent(): void {
    this.studentAttendances.forEach(attendance => {
      attendance.status = 'absent';
    });
  }

  openCreateCourseModal(): void {
    this.resetCourseForm();
    
    // Pré-remplir avec des valeurs par défaut
    if (this.groups.length > 0) {
      this.courseForm.patchValue({
        group_uuid: this.groups[0].group_uuid || this.groups[0].group_id,
        course_start_hour: '07:00',
        course_end_hour: '10:00',
        course_room: 'Salle 1',
        course_color: '#4fc3f7',
        course_date: this.selectedDate // Pré-remplir la date sélectionnée
      });
    }
    
    this.showCreateModal = true;
  }

  private clearCoursesCache(): void {
    this.coursesCache.clear();
    this.lastCoursesUpdate = Date.now();
  }

  // Méthodes manquantes pour le template
  getWeekDisplay(): string {
    const startOfWeek = this.getStartOfWeek(this.currentWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const monthStart = startOfWeek.toLocaleDateString('fr-FR', { month: 'short' });
    const monthEnd = endOfWeek.toLocaleDateString('fr-FR', { month: 'short' });
    const year = startOfWeek.getFullYear();

    if (monthStart === monthEnd) {
      return `${startOfWeek.getDate()}-${endOfWeek.getDate()} ${monthStart} ${year}`;
    } else {
      return `${startOfWeek.getDate()} ${monthStart} - ${endOfWeek.getDate()} ${monthEnd} ${year}`;
    }
  }

  onCourseClick(event: Event, course: Course): void {
    event.preventDefault();
    this.selectCourse(course);
  }

  onCancelCourse(): void {
    this.showCreateModal = false;
    this.showDetailsModal = false;
    this.courseForm.reset();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.courseForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
