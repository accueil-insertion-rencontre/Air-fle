import { AlertService, GroupService, SessionService, StudentService } from '@core/services';

import { Session, Student } from '@core/models';

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

declare let bootstrap: { Modal: new (element: Element) => { show: () => void; hide: () => void } };

@Component({
  selector: 'app-group-create',
  templateUrl: './group-create.component.html',
  styleUrls: ['./group-create.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
})
export class GroupCreateComponent implements OnInit {
  groupForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  isEditMode = false;
  groupId?: string | number;
  sessions: Session[] = [];

  // Propriétés pour la gestion des étudiants
  availableStudents: Student[] = [];
  filteredStudents: Student[] = [];
  selectedStudents: Student[] = [];
  initialStudents: Student[] = []; // Étudiants du groupe au chargement initial
  searchTerm: string = '';
  loadingStudents = false;
  studentSearchTimeout: ReturnType<typeof setTimeout> | null = null;
  addStudentModal: { show: () => void; hide: () => void } | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private groupService: GroupService,
    private sessionService: SessionService,
    private studentService: StudentService,
    private alertService: AlertService
  ) {
    this.groupForm = this.formBuilder.group({
      label: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      session_id: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadSessions();
    this.loadAvailableStudents();

    // Vérifier si nous sommes en mode édition
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.groupId = params['id'];
        if (this.groupId !== undefined) {
          this.loadGroupDetails(this.groupId);
        }
      }
    });
  }

  loadSessions(): void {
    this.sessionService.getSessions().subscribe({
      next: sessions => {
        this.sessions = sessions;
      },
      error: err => {
        // console.error('Erreur lors du chargement des sessions', err);
        this.error = 'Impossible de charger les sessions. Veuillez réessayer plus tard.';
      },
    });
  }

  loadGroupDetails(id: string | number): void {
    this.groupService.getGroupById(id).subscribe({
      next: (group) => {
        this.groupForm.patchValue({
          label: group.group_label || group.label,
          session_id: group.session_uuid || group.session_id,
        });

        // Charger les étudiants existants du groupe
        if (group.students && group.students.length > 0) {
          this.selectedStudents = group.students;
            }

        this.isEditMode = true;
        this.groupId = id;
      },
      error: () => {
        this.error = 'Erreur lors du chargement du groupe';
      }
    });
  }

  get f() {
    return this.groupForm.controls;
  }

  onSubmit() {
    
    this.submitted = true;

    // Stop si formulaire invalide
    if (this.groupForm.invalid) {
      
      return;
    }

    this.loading = true;

    // Récupérer les données du formulaire
    const formValue = { ...this.groupForm.value };
    

    if (this.isEditMode && this.groupId) {
      // Mode édition
      this.groupService.updateGroup(this.groupId, formValue).subscribe({
        next: () => {
          // En mode édition, synchroniser les étudiants du groupe
          if (this.groupId !== undefined) {
            this.synchronizeGroupStudents(this.groupId)
              .then(() => {
                this.alertService.success('Groupe modifié avec succès !');
                this.router.navigate(['/dashboard/groups']);
              })
              .catch(error => {
                // console.error('Erreur lors de la synchronisation des étudiants:', error);
                this.alertService.error(
                  'Groupe modifié mais erreur lors de la gestion des étudiants'
                );
                this.router.navigate(['/dashboard/groups']);
              });
          } else {
            this.alertService.success('Groupe modifié avec succès !');
            this.router.navigate(['/dashboard/groups']);
          }
        },
        error: error => {
          this.error =
            error?.error?.message || error?.message || 'Erreur lors de la mise à jour du groupe';
          this.loading = false;
        },
      });
    } else {
      // Mode création
      
      this.groupService.createGroup(formValue).subscribe({
        next: newGroup => {
          
          // Associer les étudiants sélectionnés au nouveau groupe
          const groupId = newGroup.group_id || newGroup.id;
          

          if (groupId) {
            this.associateStudentsToGroup(groupId).then(() => {

              this.alertService.success('Groupe créé avec succès !');
              this.router.navigate(['/dashboard/groups']);
            });
          } else {
            this.alertService.success('Groupe créé avec succès !');
            this.router.navigate(['/dashboard/groups']);
          }
        },
        error: error => {
          // console.error('❌ GROUP-CREATE - Erreur lors de la création:', error);
          this.error =
            error?.error?.message || error?.message || 'Erreur lors de la création du groupe';
          this.loading = false;
        },
      });
    }
  }

  // Vérifie si le champ a été touché et est invalide
  isFieldInvalid(fieldName: string): boolean {
    const control = this.groupForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched || this.submitted));
  }

  // Réinitialise le formulaire
  resetForm() {
    this.groupForm.reset();
    this.submitted = false;
    this.selectedStudents = [];
    this.initialStudents = [];
    this.loadAvailableStudents(); // Recharger tous les étudiants disponibles
  }

  // ========== MÉTHODES POUR LA GESTION DES ÉTUDIANTS ==========

  /**
   * Charge tous les étudiants disponibles
   */
  loadAvailableStudents(): void {
    this.loadingStudents = true;

    this.studentService.getAllStudents().subscribe({
      next: students => {
        // Filtrer les étudiants qui ne sont pas déjà sélectionnés
        interface StudentWithId extends Omit<Student, 'id'> {
          id?: string | number;
        }
        const currentStudentIds = this.selectedStudents.map(
          student => (student as StudentWithId).id || student.student_uuid
        );

        this.availableStudents = students.filter(
          student => !currentStudentIds.includes((student as StudentWithId).id || student.student_uuid)
        );
        this.filteredStudents = [...this.availableStudents];
        this.loadingStudents = false;
      },
      error: error => {
        // console.error('Erreur lors du chargement des étudiants:', error);
        this.loadingStudents = false;
      },
    });
  }

  /**
   * Ouvre le modal d'ajout d'étudiants
   */
  openAddStudentModal(): void {
    const modalElement = document.getElementById('addStudentModal');
    if (modalElement) {
      this.addStudentModal = new bootstrap.Modal(modalElement);
      this.addStudentModal.show();
    }
  }

  /**
   * Recherche des étudiants en temps réel
   */
  onStudentSearch(): void {
    // Debounce la recherche
    if (this.studentSearchTimeout) {
      clearTimeout(this.studentSearchTimeout);
    }

    this.studentSearchTimeout = setTimeout(() => {
      if (this.searchTerm.trim() === '') {
        this.filteredStudents = [...this.availableStudents];
      } else {
        const searchLower = this.searchTerm.toLowerCase();
        this.filteredStudents = this.availableStudents.filter(
          student =>
                    student.student_firstname.toLowerCase().includes(searchLower) ||
        student.student_lastname.toLowerCase().includes(searchLower) ||
                          (student.student_mail && student.student_mail.toLowerCase().includes(searchLower))
        );
      }
    }, 300);
  }

  /**
   * Toggle la sélection d'un étudiant
   */
  toggleStudentSelection(student: Student): void {
    // Utiliser 'id' car c'est ce que retourne l'API
    interface StudentWithId extends Omit<Student, 'id'> {
      id?: string | number;
    }
    const studentId = (student as StudentWithId).id || student.student_uuid;
    const index = this.selectedStudents.findIndex(
      s => ((s as StudentWithId).id || s.student_uuid) === studentId
    );

    if (index > -1) {
      this.selectedStudents.splice(index, 1);
    } else {
      this.selectedStudents.push(student);
    }

    // Recharger les étudiants disponibles pour mettre à jour le filtrage
    this.loadAvailableStudents();
  }

  /**
   * Vérifie si un étudiant est sélectionné
   */
  isStudentSelected(student: Student): boolean {
    // Utiliser 'id' car c'est ce que retourne l'API
    interface StudentWithId extends Omit<Student, 'id'> {
      id?: string | number;
    }
    const studentId = (student as StudentWithId).id || student.student_uuid;
    return this.selectedStudents.some(s => ((s as StudentWithId).id || s.student_uuid) === studentId);
  }

  /**
   * Ferme le modal d'ajout d'étudiants
   */
  closeAddStudentModal(): void {
    this.addStudentModal?.hide();
  }

  /**
   * Supprime un étudiant de la sélection
   */
  removeStudentFromSelection(student: Student): void {
    // Utiliser 'id' car c'est ce que retourne l'API
    interface StudentWithId extends Omit<Student, 'id'> {
      id?: string | number;
    }
    const studentId = (student as StudentWithId).id || student.student_uuid;
    const index = this.selectedStudents.findIndex(
      s => ((s as StudentWithId).id || s.student_uuid) === studentId
    );
    if (index > -1) {
      this.selectedStudents.splice(index, 1);

      // Recharger les étudiants disponibles pour mettre à jour le filtrage
      this.loadAvailableStudents();
    }
  }

  /**
   * TrackBy function pour optimiser le rendu
   */
  trackByStudentId(index: number, student: Student): number | string {
    interface StudentWithId extends Omit<Student, 'id'> {
      id?: string | number;
    }
    return (student as StudentWithId).id || student.student_uuid || index;
  }

  /**
   * Associe les étudiants sélectionnés à un groupe
   */
  private async associateStudentsToGroup(groupId: string | number): Promise<void> {
    if (this.selectedStudents.length === 0) {
      return Promise.resolve();
    }

    interface StudentWithId extends Omit<Student, 'id'> {
      id?: string | number;
    }
    const addPromises = this.selectedStudents.map(student => {
      // Utiliser l'ID disponible - priorité à 'id' car c'est ce que retourne l'API
      const studentId = (student as StudentWithId).id || student.student_uuid;

      if (!studentId) {
        // console.error("Aucun ID trouvé pour l'étudiant:", student);
        throw new Error(`Aucun ID trouvé pour l'étudiant ${student.student_firstname} ${student.student_lastname}`);
      }

      return this.groupService.addStudentToGroup(groupId, studentId.toString()).toPromise();
    });

    try {
      await Promise.all(addPromises);
      this.alertService.success('Étudiants associés avec succès');
    } catch (error) {
      // console.error("Erreur lors de l'association des étudiants:", error);
      // Continue quand même vers la liste des groupes
      // L'utilisateur pourra ajouter les étudiants manuellement depuis les détails du groupe
    }
  }

  /**
   * Synchronise les étudiants du groupe
   */
  private async synchronizeGroupStudents(groupId: string | number): Promise<void> {
    interface StudentWithId extends Omit<Student, 'id'> {
      id?: string | number;
    }
    // Comparer les étudiants initiaux avec les étudiants actuellement sélectionnés
    const initialStudentIds = this.initialStudents.map(
      student => (student as StudentWithId).id || student.student_uuid
    );
    const currentStudentIds = this.selectedStudents.map(
      student => (student as StudentWithId).id || student.student_uuid
    );

    // Étudiants à ajouter (dans selectedStudents mais pas dans initialStudents)
    const studentsToAdd = this.selectedStudents.filter(
      student => !initialStudentIds.includes((student as StudentWithId).id || student.student_uuid)
    );

    // Étudiants à supprimer (dans initialStudents mais pas dans selectedStudents)
    const studentsToRemove = this.initialStudents.filter(
      student => !currentStudentIds.includes((student as StudentWithId).id || student.student_uuid)
    );

    const addPromises = studentsToAdd.map(student => {
      const studentId = (student as StudentWithId).id || student.student_uuid;
      if (!studentId) {
        // console.error("Aucun ID trouvé pour l'étudiant:", student);
        throw new Error(`Aucun ID trouvé pour l'étudiant ${student.student_firstname} ${student.student_lastname}`);
      }
      return this.groupService.addStudentToGroup(groupId, studentId.toString()).toPromise();
    });

    const removePromises = studentsToRemove.map(student => {
      const studentId = (student as StudentWithId).id || student.student_uuid;
      return this.groupService.removeStudentFromGroup(groupId, studentId.toString()).toPromise();
    });

    try {
      if (addPromises.length > 0) {
        await Promise.all(addPromises);
      }

      if (removePromises.length > 0) {
        await Promise.all(removePromises);
      }
    } catch (error) {
      // console.error('Erreur lors de la synchronisation des étudiants:', error);
      throw error;
    }
  }
}
