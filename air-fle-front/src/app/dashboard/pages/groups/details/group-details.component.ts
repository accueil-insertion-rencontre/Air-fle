import { AlertService, CourseService, GroupService, StudentService } from '@core/services';

import { Course, Group, Student } from '@core/models';

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

declare let bootstrap: any;

@Component({
  selector: 'app-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class GroupDetailsComponent implements OnInit {
  groupId!: string | number;
  group: Group | null = null;
  students: Student[] = [];
  loading = true;
  error: string | null = null;

  // Propriétés pour l'ajout d'étudiants
  addStudentModal: any;
  availableStudents: Student[] = [];
  filteredStudents: Student[] = [];
  selectedStudents: Student[] = [];
  searchTerm: string = '';
  loadingStudents = false;
  studentSearchTimeout: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private groupService: GroupService,
    private studentService: StudentService,
    private courseService: CourseService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      this.groupId = id;
        this.loadGroup();
    });
  }

  loadGroup(): void {
    this.loading = true;
    this.groupService.getGroupById(this.groupId).subscribe({
      next: (data) => {


        this.group = data;

        // Extraire les étudiants du groupe
        if (this.group.students && Array.isArray(this.group.students)) {
          this.students = this.group.students.map((relation: any) => {
            return relation.student || relation;
          });
        } else {
          this.students = [];
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ GROUP-DETAILS - Erreur lors du chargement:', error);
        this.error = 'Erreur lors du chargement du groupe';
        this.loading = false;
      }
    });
  }

  formatDate(date: any): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getSessionLabel(session: any): string {
    
    if (!session) {
      
      return 'AUTRES FORMATIONS PROFESSIONNELLES';
    }
    const result = session.session_label || session.label || 'AUTRES FORMATIONS PROFESSIONNELLES';
    
    return result;
  }

  /**
   * Supprimer le groupe
   */
  deleteGroup(): void {
    if (!this.group) return;

    const confirmMessage =
      this.students.length > 0
        ? `Êtes-vous sûr de vouloir supprimer le groupe "${this.group.label}" ?\n\n` +
          `Ce groupe contient ${this.students.length} étudiant(s). Ils seront retirés du groupe mais ne seront pas supprimés.\n` +
          `Tous les cours associés à ce groupe seront également supprimés.\n` +
          `La session ne sera pas affectée.\n\n` +
          'Cette action est irréversible.'
        : `Êtes-vous sûr de vouloir supprimer le groupe "${this.group.label}" ?\n\n` +
          `Tous les cours associés à ce groupe seront également supprimés.\n` +
          `La session ne sera pas affectée.\n\n` +
          'Cette action est irréversible.';

    this.alertService.confirm(confirmMessage, 'Supprimer le groupe').then(confirmed => {
      if (confirmed) {
        this.startGroupDeletion();
      }
    });
  }

  /**
   * Démarre le processus de suppression du groupe avec l'ordre correct
   */
  private async startGroupDeletion(): Promise<void> {
    try {
      

      // Étape 1: Supprimer tous les cours associés au groupe
      await this.deleteAllGroupCourses();

      // Étape 2: Retirer tous les étudiants du groupe
      if (this.students.length > 0) {
        await this.removeAllStudentsFromGroup();
      }

      // Étape 3: Supprimer le groupe lui-même
      this.performGroupDeletion();
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
  private async deleteAllGroupCourses(): Promise<void> {
    

    try {
      // Récupérer tous les cours du groupe
      const courses = await this.courseService.getCoursesByGroupId(this.groupId).toPromise();

      if (!courses || courses.length === 0) {
        
        return;
      }

      console.log(
        `${courses.length} cours trouvés à supprimer:`,
        courses.map(c => c.title)
      );

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

  /**
   * Retire tous les étudiants du groupe
   */
  private async removeAllStudentsFromGroup(): Promise<void> {
    

    const removePromises = this.students.map(student => {
      const studentId = (student as any).id || (student as any).student_id;
      
      return this.groupService
        .removeStudentFromGroup(this.groupId, studentId.toString())
        .toPromise();
    });

    await Promise.all(removePromises);
    
  }

  /**
   * Effectue la suppression du groupe
   */
  private performGroupDeletion(): void {
    

    this.groupService.deleteGroup(this.groupId).subscribe({
      next: () => {
        
        const successMessage =
          `Groupe "${this.group?.label}" supprimé avec succès !\n\n` +
          `✅ Cours associés supprimés\n` +
          `✅ Étudiants retirés du groupe (mais non supprimés)\n` +
          `✅ Groupe supprimé\n` +
          `ℹ️ La session reste intacte`;

        this.alertService.success(successMessage).then(() => {
          this.router.navigate(['/dashboard/groups']);
        });
      },
      error: err => {
        console.error('Erreur lors de la suppression du groupe', err);
        console.error("Détails de l'erreur:", {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          errorDetails: err.error,
        });

        // Message d'erreur plus informatif
        let errorMessage = 'Erreur lors de la suppression du groupe.';

        if (err.error && err.error.message) {
          if (err.error.message.includes('constraint')) {
            errorMessage =
              "Impossible de supprimer le groupe : il est encore lié à d'autres éléments. " +
              'Les cours et étudiants ont été traités, mais le groupe lui-même ne peut être supprimé. ' +
              "Contactez l'administrateur.";
          } else {
            errorMessage = `Erreur API: ${err.error.message}`;
          }
        }

        this.alertService.error(errorMessage);
      },
    });
  }

  // ========== MÉTHODES POUR LA GESTION DES ÉTUDIANTS ==========

  /**
   * Ouvre le modal d'ajout d'étudiants
   */
  openAddStudentModal(): void {
    this.loadAvailableStudents();

    const modalElement = document.getElementById('addStudentModal');
    if (modalElement) {
      this.addStudentModal = new bootstrap.Modal(modalElement);
      this.addStudentModal.show();
    }
  }

  /**
   * Charge les étudiants disponibles (qui ne sont pas déjà dans le groupe)
   */
  loadAvailableStudents(): void {
    this.loadingStudents = true;
    

    this.studentService.getAllStudents().subscribe({
      next: allStudents => {
        

        // Filtrer les étudiants qui ne sont pas déjà dans le groupe
        // Maintenant this.students contient les objets étudiants extraits
        const currentStudentIds = this.students.map(student => (student as any).id);
        

        this.availableStudents = allStudents.filter(
          student => !currentStudentIds.includes((student as any).id || student.student_uuid)
        );
        this.filteredStudents = [...this.availableStudents];
        this.loadingStudents = false;

        
      },
      error: error => {
        console.error('Erreur lors du chargement des étudiants:', error);
        this.loadingStudents = false;
        this.alertService.error('Erreur lors du chargement des étudiants');
      },
    });
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
    const studentId = (student as any).id || student.student_uuid;
    

    const index = this.selectedStudents.findIndex(
      s => ((s as any).id || s.student_uuid) === studentId
    );

    

    if (index > -1) {
      this.selectedStudents.splice(index, 1);
      
    } else {
      this.selectedStudents.push(student);
      
    }

    console.log("Nombre d'étudiants sélectionnés après:", this.selectedStudents.length);
    console.log(
      'Liste des étudiants sélectionnés:',
      this.selectedStudents.map(s => s.firstname + ' ' + s.lastname)
    );
  }

  /**
   * Méthode de test pour forcer la sélection du premier étudiant
   */
  testForceSelection(): void {
    if (this.filteredStudents.length > 0) {
      
      this.toggleStudentSelection(this.filteredStudents[0]);
    }
  }

  /**
   * Vérifie si un étudiant est sélectionné
   */
  isStudentSelected(student: Student): boolean {
    // Utiliser 'id' car c'est ce que retourne l'API
    const studentId = (student as any).id || student.student_uuid;
    return this.selectedStudents.some(s => ((s as any).id || s.student_uuid) === studentId);
  }

  /**
   * Ajoute les étudiants sélectionnés au groupe
   */
  addSelectedStudentsToGroup(): void {
    if (this.selectedStudents.length === 0) {
      this.alertService.error('Veuillez sélectionner au moins un étudiant');
      return;
    }

    

    const addPromises = this.selectedStudents.map(student => {
      // Utiliser l'ID disponible - priorité à 'id' car c'est ce que retourne l'API
      const studentId = (student as any).id || student.student_uuid;

      if (!studentId) {
        console.error("Aucun ID trouvé pour l'étudiant:", student);
        throw new Error(`Aucun ID trouvé pour l'étudiant ${student.student_firstname} ${student.student_lastname}`);
      }

      
      return this.groupService.addStudentToGroup(this.groupId, studentId.toString()).toPromise();
    });

    Promise.all(addPromises)
      .then(() => {
        this.alertService.success(
          `${this.selectedStudents.length} étudiant(s) ajouté(s) au groupe`
        );
        this.closeAddStudentModal();
        this.loadGroup(); // Recharger les données du groupe
      })
      .catch(error => {
        console.error("Erreur lors de l'ajout des étudiants:", error);
        this.alertService.error("Erreur lors de l'ajout des étudiants");
      });
  }

  /**
   * Ferme le modal d'ajout d'étudiants
   */
  closeAddStudentModal(): void {
    this.selectedStudents = [];
    this.searchTerm = '';
    this.filteredStudents = [];
    this.availableStudents = [];
    this.addStudentModal?.hide();
  }

  /**
   * Supprime un étudiant du groupe
   */
  removeStudentFromGroup(student: Student): void {
    const confirmMessage = `Êtes-vous sûr de vouloir retirer ${student.student_firstname} ${student.student_lastname} de ce groupe ?`;

    this.alertService.confirm(confirmMessage).then(confirmed => {
      if (confirmed) {
              // Maintenant student contient directement les données d'étudiant avec la propriété id
      const studentId = (student as any).id || student.student_uuid;

        if (!studentId) {
          console.error("Aucun ID trouvé pour l'étudiant:", student);
          this.alertService.error(
            `Aucun ID trouvé pour l'étudiant ${student.student_firstname} ${student.student_lastname}`
          );
          return;
        }



        this.groupService.removeStudentFromGroup(this.groupId, studentId.toString()).subscribe({
          next: () => {
            this.alertService.success('Étudiant retiré du groupe avec succès');
            this.loadGroup(); // Recharger les données du groupe
          },
          error: error => {
            console.error("Erreur lors de la suppression de l'étudiant:", error);
            this.alertService.error("Erreur lors de la suppression de l'étudiant");
          },
        });
      }
    });
  }

  /**
   * TrackBy function pour optimiser le rendu
   */
  trackByStudentId(index: number, student: Student): number | string {
    return (student as any).id || student.student_uuid || index;
  }
}
