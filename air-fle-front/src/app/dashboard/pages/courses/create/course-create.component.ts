import { AlertService, CourseService, SessionService, UserService } from '@core/services';

import { Course, Session, UserDisplayInfo } from '@core/models';

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-course-create',
  templateUrl: './course-create.component.html',
  styleUrls: ['./course-create.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
})
export class CourseCreateComponent implements OnInit {
  courseForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  isEditMode = false;
  courseId?: string | number;
  sessions: Session[] = [];
  teachers: UserDisplayInfo[] = [];

  // Créneaux horaires disponibles
  timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private courseService: CourseService,
    private sessionService: SessionService,
    private userService: UserService,
    private alertService: AlertService
  ) {
    this.courseForm = this.formBuilder.group({
      session_uuid: [null, Validators.required],
      course_day: ['', Validators.required],
      course_name: ['', [Validators.required, Validators.minLength(3)]],
      course_start_hour: ['', Validators.required],
      course_end_hour: ['', Validators.required],
      user_uuid: [''], // Optionnel
    });
  }

  ngOnInit(): void {
    this.loadSessions();
    this.loadTeachers();

    // Vérifier si nous sommes en mode édition
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.courseId = params['id'];
        if (this.courseId) {
          this.loadCourseDetails(this.courseId);
        }
      } else {
        // En mode création, définir la date d'aujourd'hui par défaut
        const today = new Date().toISOString().split('T')[0];
        this.courseForm.patchValue({
          course_day: today,
          course_start_hour: '09:00',
          course_end_hour: '12:00',
        });
      }
    });
  }

  loadSessions(): void {
    this.loading = true;
    this.sessionService.getSessions().subscribe({
      next: sessions => {
        this.sessions = sessions;
        this.loading = false;
      },
      error: err => {
        this.error = 'Impossible de charger les sessions. Veuillez réessayer plus tard.';
        this.loading = false;
      },
    });
  }

  loadTeachers(): void {
    this.userService.getTeachers().subscribe({
      next: teachers => {
        this.teachers = teachers;
      },
      error: err => {
        this.error = 'Impossible de charger les professeurs. Veuillez réessayer plus tard.';
      },
    });
  }

  loadCourseDetails(id: string | number): void {
    this.loading = true;
    this.courseService.getCourseById(id).subscribe({
      next: course => {
        this.courseForm.patchValue({
          session_uuid: course.session?.session_uuid || course.session?.session_id,
          course_day: course.course_day || course.day,
          course_name: course.course_name || course.title || course.intitule,
          course_start_hour: course.course_start_hour || course.start_hour,
          course_end_hour: course.course_end_hour || course.end_hour,
          user_uuid: course.user?.user_uuid || course.user?.user_id,
        });

        this.loading = false;
      },
      error: err => {
        this.error = 'Impossible de charger les détails du cours. Veuillez réessayer plus tard.';
        this.loading = false;
      },
    });
  }

  onSubmit() {
    this.submitted = true;

    // Stop si formulaire invalide
    if (this.courseForm.invalid) {
      return;
    }

    this.loading = true;

    // Préparer les données du formulaire avec les nouveaux noms API
    const formValue: Partial<Course> = {
      course_name: this.courseForm.value.course_name,
      course_day: this.courseForm.value.course_day,
      course_start_hour: this.courseForm.value.course_start_hour,
      course_end_hour: this.courseForm.value.course_end_hour,
      group_uuid: this.courseForm.value.session_uuid, // À corriger si nécessaire
      user_uuid: this.courseForm.value.user_uuid,
    };

    if (this.isEditMode && this.courseId) {
      // Mode édition
      this.courseService.updateCourse(this.courseId, formValue).subscribe({
        next: () => {
          this.alertService.success('Cours modifié avec succès !').then(() => {
            this.router.navigate(['/dashboard/courses']);
          });
        },
        error: error => {
          this.error = error?.error?.message || 'Une erreur est survenue lors de la modification';
          this.loading = false;
        },
      });
    } else {
      // Mode création
      this.courseService.createCourse(formValue).subscribe({
        next: () => {
          this.alertService.success('Cours créé avec succès !').then(() => {
            this.router.navigate(['/dashboard/courses']);
          });
        },
        error: error => {
          this.error = error?.error?.message || 'Une erreur est survenue lors de la création';
          this.loading = false;
        },
      });
    }
  }

  // Vérifie si le champ a été touché et est invalide
  isFieldInvalid(fieldName: string): boolean {
    const control = this.courseForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched || this.submitted));
  }

  // Réinitialise le formulaire
  resetForm() {
    const today = new Date().toISOString().split('T')[0];
    this.courseForm.reset({
      course_day: today,
      course_name: '',
      course_start_hour: '09:00',
      course_end_hour: '12:00',
    });
    this.submitted = false;
    this.error = '';
  }
}
