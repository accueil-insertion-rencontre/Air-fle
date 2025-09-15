import { AlertService, CourseService, GroupService, SessionService } from '@core/services';

import { Group, Session } from '@core/models';

import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

// Déclaration de jQuery qui est maintenant disponible globalement
// Bootstrap/jQuery supprimés

@Component({
  selector: 'app-group-list',
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
})
export class GroupListComponent implements OnInit, AfterViewInit {
  groups: Group[] = [];
  sessions: Session[] = [];
  loading = true;
  groupForm: FormGroup;
  submitted = false;
  error = '';
  isCreateModalOpen = false;

  constructor(
    private groupService: GroupService,
    private sessionService: SessionService,
    private courseService: CourseService,
    private formBuilder: FormBuilder,
    private alertService: AlertService
  ) {
    this.groupForm = this.formBuilder.group({
      label: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      session_id: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadGroups();
    this.loadSessions();
  }

  ngAfterViewInit(): void {
    // View initialization complete
  }

  // Méthode pour obtenir le label de session
  getSessionLabel(session: any): string {
    if (!session) return 'AUTRES FORMATIONS PROFESSIONNELLES';
    return session.session_label || session.label || 'AUTRES FORMATIONS PROFESSIONNELLES';
  }

  // Méthode pour initialiser les icônes Feather
  private initializeFeatherIcons(): void {
    if (typeof (window as any).feather !== 'undefined') {
      (window as any).feather.replace();
      
    } else {
      // Feather not available
    }
  }

  loadGroups(): void {
    this.loading = true;
    this.groupService.getGroups().subscribe({
      next: groups => {
        this.groups = groups;
        this.loading = false;
      },
      error: err => {
        console.error('Erreur lors du chargement des groupes', err);
        this.loading = false;
      },
    });
  }

  loadSessions(): void {
    this.sessionService.getSessions().subscribe({
      next: sessions => {
        this.sessions = sessions;
      },
      error: err => {
        console.error('Erreur lors du chargement des sessions', err);
        this.error = 'Impossible de charger les sessions. Veuillez réessayer plus tard.';
      },
    });
  }

  openCreateModal(): void { this.resetForm(); this.isCreateModalOpen = true; }
  closeCreateModal(): void { this.isCreateModalOpen = false; }

  dateFormatter(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString('fr-FR');
  }

  deleteGroup(id: string | number): void {
    // Récupérer d'abord les informations du groupe pour connaître les étudiants
    this.groupService.getGroupById(id).subscribe({
      next: group => {
        const studentsCount = group.students ? group.students.length : 0;

        const confirmMessage =
          studentsCount > 0
            ? `Êtes-vous sûr de vouloir supprimer le groupe "${group.label}" ?\n\n` +
              `Ce groupe contient ${studentsCount} étudiant(s). Ils seront retirés du groupe mais ne seront pas supprimés.\n` +
              `Tous les cours associés à ce groupe seront également supprimés.\n` +
              `La session ne sera pas affectée.\n\n` +
              'Cette action est irréversible.'
            : `Êtes-vous sûr de vouloir supprimer le groupe "${group.label}" ?\n\n` +
              `Tous les cours associés à ce groupe seront également supprimés.\n` +
              `La session ne sera pas affectée.\n\n` +
              'Cette action est irréversible.';

        this.alertService.confirm(confirmMessage).then(confirmed => {
          if (confirmed) {
            this.startGroupDeletion(id, group);
          }
        });
      },
      error: err => {
        console.error('Erreur lors du chargement des informations du groupe', err);
        this.alertService.error('Erreur lors du chargement des informations du groupe.');
      },
    });
  }

  /**
   * Retire tous les étudiants du groupe
   */
  private async removeAllStudentsFromGroup(
    groupId: string | number,
    students: any[]
  ): Promise<void> {
    

    const removePromises = students.map(relation => {
      // Extraire l'ID de l'étudiant depuis l'objet relation
      const studentId = relation.student ? relation.student.student_uuid : relation.id;
      
      return this.groupService.removeStudentFromGroup(groupId, studentId.toString()).toPromise();
    });

    await Promise.all(removePromises);
    
  }

  /**
   * Vérifie que le groupe est vide puis le supprime
   */
  private verifyAndDeleteGroup(id: string | number): void {
    

    // Re-charger les informations du groupe pour vérifier qu'il est vide
    this.groupService.getGroupById(id).subscribe({
      next: group => {
        const remainingStudents = group.students ? group.students.length : 0;


        if (remainingStudents > 0) {
          console.warn('Il reste encore des étudiants dans le groupe, abandon de la suppression');
          this.alertService.error(
            'Erreur : Il reste encore des étudiants dans le groupe. Suppression annulée.'
          );
        } else {
          
          this.performGroupDeletion(id);
        }
      },
      error: err => {
        console.error('Erreur lors de la vérification du groupe:', err);
        // Si on ne peut pas vérifier, on essaie quand même de supprimer
        
        this.performGroupDeletion(id);
      },
    });
  }

  /**
   * Effectue la suppression du groupe
   */
  private performGroupDeletion(id: string | number): void {
    

    this.groupService.deleteGroup(id).subscribe({
      next: () => {
        
        this.groups = this.groups.filter(g => g.group_id !== id);

        const successMessage =
          `Groupe supprimé avec succès !\n\n` +
          `✅ Cours associés supprimés\n` +
          `✅ Étudiants retirés du groupe (mais non supprimés)\n` +
          `✅ Groupe supprimé\n` +
          `ℹ️ La session reste intacte`;

        this.alertService.success(successMessage);
      },
      error: err => {
        console.error('Erreur lors de la suppression du groupe', err);
        console.error("Détails de l'erreur:", {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          errorDetails: err.error,
        });

        // Afficher les détails complets de l'erreur pour debug
        if (err.error) {
          console.error('Contenu de err.error:', JSON.stringify(err.error, null, 2));
        }

        // Message d'erreur plus informatif
        let errorMessage = 'Erreur lors de la suppression du groupe.';

        if (err.status === 500) {
          if (err.error && err.error.message) {
            if (
              err.error.message.includes('constraint') ||
              err.error.message.includes('foreign key')
            ) {
              errorMessage =
                "Impossible de supprimer le groupe : il est encore lié à d'autres éléments dans la base de données.\n\n" +
                'Causes possibles :\n' +
                '• Des cours sont encore associés au groupe\n' +
                '• Des étudiants sont encore liés au groupe\n' +
                "• D'autres références existent dans le système\n\n" +
                "L'administrateur doit vérifier manuellement la base de données.";
            } else {
              errorMessage =
                `Erreur serveur interne: ${err.error.message}\n\n` +
                'Cette erreur nécessite une intervention technique.';
            }
          } else {
            errorMessage =
              'Erreur 500 - Erreur serveur interne.\n\n' +
              'Causes possibles :\n' +
              '• Problème de base de données\n' +
              "• Erreur dans l'API backend\n" +
              '• Contraintes de clés étrangères non résolues\n\n' +
              "Veuillez contacter l'administrateur.";
          }
        } else if (err.status === 404) {
          errorMessage =
            "Le groupe à supprimer n'a pas été trouvé. Il a peut-être déjà été supprimé.";
        } else if (err.status === 403) {
          errorMessage = "Vous n'avez pas les permissions nécessaires pour supprimer ce groupe.";
        } else if (err.error && err.error.message) {
          errorMessage = `Erreur API: ${err.error.message}`;
        }

        this.alertService.error(errorMessage);
      },
    });
  }

  /**
   * Démarre le processus de suppression du groupe avec l'ordre correct
   */
  private async startGroupDeletion(groupId: string | number, group: any): Promise<void> {
    try {
      

      // Étape 1: Supprimer tous les cours associés au groupe
      await this.deleteAllGroupCourses(groupId);

      // Étape 2: Retirer tous les étudiants du groupe
      if (group.students && group.students.length > 0) {
        await this.removeAllStudentsFromGroup(groupId, group.students);
      }

      // Étape 3: Supprimer le groupe lui-même
      this.performGroupDeletion(groupId);
    } catch (error) {
      console.error('Erreur lors du processus de suppression:', error);
      this.alertService.error(
        'Erreur lors de la suppression. Certaines étapes ont peut-être échoué.'
      );
    }
  }

  /**
   * Supprime tous les cours associés au groupe
   */
  private async deleteAllGroupCourses(groupId: string | number): Promise<void> {
    

    try {
      // Récupérer tous les cours du groupe
      const courses = await this.courseService.getCoursesByGroupId(groupId).toPromise();

      if (!courses || courses.length === 0) {
        
        return;
      }



      // Supprimer tous les cours individuellement avec gestion d'erreur par cours
      const deleteResults = await Promise.allSettled(
        courses.map(async course => {
          const courseId = course.course_id || course.id;
          if (courseId) {

            try {
              await this.courseService.deleteCourse(courseId).toPromise();

              return { success: true, course: course.title };
            } catch (error) {
              console.error('❌ Erreur lors de la suppression du cours:', course.title, error);
              return { success: false, course: course.title, error };
            }
          } else {
            console.warn('Cours sans ID trouvé:', course);
            return { success: false, course: course.title || 'Cours sans nom', error: "Pas d'ID" };
          }
        })
      );

      // Analyser les résultats
      const successful = deleteResults.filter(
        r => r.status === 'fulfilled' && r.value.success
      ).length;
      const failed = deleteResults.filter(
        r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
      ).length;

      

      if (failed > 0) {
        console.warn(
          `${failed} cours n'ont pas pu être supprimés, mais on continue avec la suppression du groupe`
        );
        // On continue quand même avec la suppression du groupe
      } else {
        // No courses to delete
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des cours du groupe:', error);
      console.warn('Impossible de récupérer les cours, on continue avec la suppression du groupe');
      // On continue quand même le processus, même si on ne peut pas récupérer les cours
    }
  }

  // Méthodes pour le formulaire
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

    // Récupérer les valeurs du formulaire
    const formValues = this.groupForm.value;
    

    // Examiner la structure de session_id en détail
    

    // Préparer les données avec les champs obligatoires (API format)
    const formData = {
      group_label: formValues.label,
      session_uuid: formValues.session_id,
    };

    // Afficher les données dans la console pour debug
    

    // Création du groupe
    this.groupService.createGroup(formData).subscribe({
      next: response => {

        this.closeCreateModal();
        this.loadGroups(); // Recharger la liste des groupes
        this.loading = false;
      },
      error: error => {
        console.error('Erreur complète:', error);
        // Afficher l'erreur détaillée pour comprendre le problème
        if (error.error && error.error.message) {
          console.error("Message d'erreur API:", error.error.message);
        }
        if (error.status) {
          console.error('Statut HTTP:', error.status);
        }
        this.error = error?.error?.message || error?.message || 'Une erreur est survenue';
        this.loading = false;
      },
    });
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
    this.error = '';
  }
}
