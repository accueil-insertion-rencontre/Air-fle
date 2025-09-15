import { GroupService, SessionService } from '@core/services';

import { Group, Session } from '@core/models';

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-group-form',
  templateUrl: './group-form.component.html',
  styleUrls: ['./group-form.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class GroupFormComponent implements OnInit {
  groupForm: FormGroup;
  isEditMode = false;
  groupId?: number;
  sessions: Session[] = [];
  loading = false;
  submitted = false;
  availableStudents: any[] = []; // Normalement, on chargerait les étudiants disponibles
  selectedStudents: any[] = []; // Étudiants sélectionnés pour ce groupe

  constructor(
    private fb: FormBuilder,
    private groupService: GroupService,
    private sessionService: SessionService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.groupForm = this.fb.group({
      label: ['', [Validators.required]],
      session_id: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadSessions();

    // Vérifier si on est en mode édition
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.groupId = +params['id'];
        this.loadGroup(this.groupId);
      }
    });
  }

  loadSessions(): void {
    this.sessionService.getSessions().subscribe({
      next: data => {
        this.sessions = data;
      },
      error: err => console.error('Erreur lors du chargement des sessions', err),
    });
  }

  loadGroup(id: number): void {
    this.loading = true;
    this.groupService.getGroupById(id).subscribe({
      next: group => {
        this.groupForm.patchValue({
          label: group.label,
          session_id: group.session_id,
        });

        if (group.students) {
          this.selectedStudents = group.students;
        }

        this.loading = false;
      },
      error: err => {
        console.error('Erreur lors du chargement du groupe', err);
        this.loading = false;
      },
    });
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.groupForm.invalid) {
      return;
    }

    this.loading = true;
    const groupData: Group = this.groupForm.value;

    if (this.isEditMode && this.groupId) {
      groupData.group_id = this.groupId;
      this.groupService.updateGroup(groupData).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/dashboard/groups']);
        },
        error: err => {
          console.error('Erreur lors de la mise à jour du groupe', err);
          this.loading = false;
        },
      });
    } else {
      this.groupService.createGroup(groupData).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/dashboard/groups']);
        },
        error: err => {
          console.error('Erreur lors de la création du groupe', err);
          this.loading = false;
        },
      });
    }
  }

  addStudentToGroup(student: any): void {
    if (this.groupId) {
      this.groupService.addStudentToGroup(this.groupId, student.student_uuid).subscribe({
        next: () => {
          this.selectedStudents.push(student);
          this.availableStudents = this.availableStudents.filter(
            s => s.student_uuid !== student.student_uuid
          );
        },
        error: err => console.error("Erreur lors de l'ajout de l'étudiant au groupe", err),
      });
    }
  }

  removeStudentFromGroup(student: any): void {
    if (this.groupId) {
      this.groupService.removeStudentFromGroup(this.groupId, student.student_uuid).subscribe({
        next: () => {
          this.availableStudents.push(student);
          this.selectedStudents = this.selectedStudents.filter(
            s => s.student_uuid !== student.student_uuid
          );
        },
        error: err => console.error("Erreur lors du retrait de l'étudiant du groupe", err),
      });
    }
  }
}
