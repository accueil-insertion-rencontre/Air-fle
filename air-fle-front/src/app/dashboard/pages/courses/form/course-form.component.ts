import { CourseService, GroupService } from '@core/services';

import { Course, Group } from '@core/models';

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-course-form',
  templateUrl: './course-form.component.html',
  styleUrls: ['./course-form.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class CourseFormComponent implements OnInit {
  courseForm: FormGroup;
  isEditMode = false;
  courseId?: number;
  groups: Group[] = [];
  loading = false;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private groupService: GroupService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.courseForm = this.fb.group({
      intitule: ['', [Validators.required]],
      day_: ['', [Validators.required]],
      start_hour: ['', [Validators.required]],
      end_hour: ['', [Validators.required]],
      group_id: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadGroups();

    // Vérifier si on est en mode édition
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.courseId = +params['id'];
        this.loadCourse(this.courseId);
      }
    });
  }

  loadGroups(): void {
    this.groupService.getGroups().subscribe({
      next: data => {
        this.groups = data;
      },
      error: err => console.error('Erreur lors du chargement des groupes', err),
    });
  }

  loadCourse(id: number): void {
    this.loading = true;
    this.courseService.getCourseById(id).subscribe({
      next: course => {
        // Formater les dates pour les champs de formulaire
        const day = new Date(course.day_).toISOString().split('T')[0];
        const startHour = new Date(course.start_hour).toISOString().split('T')[1].substring(0, 5);
        const endHour = new Date(course.end_hour).toISOString().split('T')[1].substring(0, 5);

        this.courseForm.patchValue({
          intitule: course.intitule,
          day_: day,
          start_hour: startHour,
          end_hour: endHour,
          group_id: course.group_id,
        });

        this.loading = false;
      },
      error: err => {
        console.error('Erreur lors du chargement du cours', err);
        this.loading = false;
      },
    });
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.courseForm.invalid) {
      return;
    }

    this.loading = true;
    const formValues = this.courseForm.value;

    // Créer des objets Date pour les heures
    const dayDate = new Date(formValues.day_);

    const startParts = formValues.start_hour.split(':');
    const startDate = new Date(dayDate);
    startDate.setHours(parseInt(startParts[0], 10), parseInt(startParts[1], 10), 0);

    const endParts = formValues.end_hour.split(':');
    const endDate = new Date(dayDate);
    endDate.setHours(parseInt(endParts[0], 10), parseInt(endParts[1], 10), 0);

    const courseData: Course = {
      intitule: formValues.intitule,
      day_: dayDate,
      start_hour: startDate,
      end_hour: endDate,
      group_id: parseInt(formValues.group_id, 10),
    };

    if (this.isEditMode && this.courseId) {
      courseData.session_id = this.courseId;
      this.courseService.updateCourse(courseData).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/dashboard/courses']);
        },
        error: err => {
          console.error('Erreur lors de la mise à jour du cours', err);
          this.loading = false;
        },
      });
    } else {
      this.courseService.createCourse(courseData).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/dashboard/courses']);
        },
        error: err => {
          console.error('Erreur lors de la création du cours', err);
          this.loading = false;
        },
      });
    }
  }
}
