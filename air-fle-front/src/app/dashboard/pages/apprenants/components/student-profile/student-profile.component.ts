import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StudentService } from '@core/services';
import { AttendanceService, Absence } from '@core/services/attendance.service';
import { ReferenceDataService } from '@core/services';
import { ExamService } from '@core/services';
// StudentAbsenceHistoryComponent retiré (non utilisé)
import { Student } from '@core/models';
import { Level } from '@core/models';
// Exam affichage pour récupérer les notes

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-profile.component.html',
  styleUrls: ['./student-profile.component.scss'],
})
export class StudentProfileComponent implements OnInit {
  student: Student | null = null;
  loading = true;
  error: string | null = null;
  showAbsenceHistory = false;
  // Absences récentes
  recentAbsences: Absence[] = [];
  loadingAbsences = false;
  absencesError: string | null = null;
  // showDocumentModal supprimé avec la fonctionnalité d'attestations
  showDeleteConfirmModal = false;
  
  // Section notes supprimée (refonte à venir)
  // Notes
  recentNotes: Array<{ label: string; score: string; date: string | Date }> = [];
  loadingNotes = false;
  notesError: string | null = null;

  // Données de référence pour le mapping
  statuses: any[] = [];
  nationalities: any[] = [];
  frenchLevels: any[] = [];
  genders: any[] = [];
  orientations: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentService: StudentService,
    private referenceDataService: ReferenceDataService,
    private examService: ExamService,
    private attendanceService: AttendanceService
  ) {}

  ngOnInit(): void {
    this.loadReferenceData();
    // Recharge à chaque changement d'id ou de query (ex: r=timestamp)
    this.route.params.subscribe(() => this.loadStudent());
    this.route.queryParamMap.subscribe(() => this.loadStudent());
  }

  // Forcer un rafraîchissement si on revient sur la même route (via param r par ex.)
  // Appelé depuis le routeur au changement de query params
  onRefreshRequest(): void {
    this.loadStudent();
  }

  private loadReferenceData(): void {
    // Charger toutes les données de référence dès l'initialisation
    this.referenceDataService.getNationalities().subscribe(data => this.nationalities = data);
    this.referenceDataService.getGenders().subscribe(data => this.genders = data);
    this.referenceDataService.getStatuses().subscribe(data => this.statuses = data);
    this.referenceDataService.getOrientations().subscribe(data => this.orientations = data);
    // Ajoute d'autres si besoin (frenchLevels, etc.)
  }

  loadStudent(): void {
    const id = this.route.snapshot.params['id'];
    if (!id) {
      this.error = 'ID étudiant invalide';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    this.studentService.getStudentById(id).subscribe({
      next: student => {
        this.student = student;
        this.loading = false; // Marquer le chargement comme terminé
        // Charger les notes de l'étudiant
        this.loadStudentNotes();
        this.loadRecentAbsences(); // Charger les absences récentes
      },
      error: err => {
        console.error('❌ Erreur lors du chargement:', err);
        this.error = "Erreur lors du chargement du profil de l'étudiant";
        this.loading = false;
      },
    });
  }

  // Charger les notes (via ExamService.getExamsByStudent)
  private loadStudentNotes(): void {
    if (!this.student?.student_uuid) return;
    this.loadingNotes = true;
    this.notesError = null;
    this.examService.getExamsByStudent(this.student.student_uuid).subscribe({
      next: (exams: any[]) => {
        const notes: Array<{ label: string; score: string; date: string | Date }> = [];
        exams.forEach((exam: any) => {
          // récupérer les données étudiant pour cet examen
          let score: string | undefined;
          let status: string | undefined;
          const date: string | Date | undefined = exam.exam?.exam_taked_at || exam.exam_taked_at || exam.taken_at;
          const label = exam.exam?.exam_label || exam.exam_label || 'Examen';

          if (exam.students && Array.isArray(exam.students)) {
            const me = exam.students.find((s: any) => s.student_uuid === this.student?.student_uuid);
            score = me?.exam_score;
            status = me?.exam_status;
          } else if (exam.student_uuid && (exam.exam_score !== undefined || exam.exam_status !== undefined)) {
            // structure plate
            score = exam.exam_score;
            status = exam.exam_status;
          }

          if (score !== undefined) {
            notes.push({ label, score, date: date || '' });
          }
        });

        // trier par date décroissante si dispo
        this.recentNotes = notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.loadingNotes = false;
      },
      error: (err) => {
        console.error('❌ Erreur chargement notes:', err);
        this.notesError = 'Impossible de charger les notes';
        this.loadingNotes = false;
      }
    });
  }



  calculateAge(birthdate: string): number {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  getStudentInitials(): string {
    if (!this.student) return '';
    const firstName = this.student.student_firstname || '';
    const lastName = this.student.student_lastname || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  getStatusLabel(): string {
    if (!this.student) return 'Non défini';
    
    if (this.student.status) {
      return this.student.status.status_label;
    }

    // Fallback avec les données de référence si nécessaire
    if (this.student.status_uuid && this.statuses.length > 0) {
      const status = this.statuses.find(s => s.id === this.student!.status_uuid);
      return status?.label || 'Non défini';
    }

    return 'Non défini';
  }

  getNationalityLabel(): string {
    if (!this.student) return 'Non renseignée';
    
    try {
      // Vérifier d'abord le tableau nationalities
      if (this.student.nationalities && this.student.nationalities.length > 0) {
        // Utiliser any pour éviter les erreurs de type
        const firstNationality = this.student.nationalities[0] as any;
        
        // Essayer d'accéder à nationality.nationality_label
        if (firstNationality.nationality && firstNationality.nationality.nationality_label) {
          return firstNationality.nationality.nationality_label;
        }
      }
    } catch (error) {
      // Erreur silencieuse en production
    }

    // Fallback avec les données de référence si nécessaire
    if (this.student.nationality_uuid && this.nationalities.length > 0) {
      const nationality = this.nationalities.find(n => n.id === this.student!.nationality_uuid);
      return nationality?.label || 'Non renseignée';
    }

    return 'Non renseignée';
  }

  getGenderLabel(): string {
    if (!this.student) return 'Non renseigné';
    
    if (this.student.gender) {
      return this.student.gender.gender_label;
    }

    // Fallback avec les données de référence si nécessaire
    if (this.student.gender_uuid && this.genders.length > 0) {
      const gender = this.genders.find(g => g.id === this.student!.gender_uuid);
      return gender?.label || 'Non renseigné';
    }

    return 'Non renseigné';
  }

  getOrientationLabel(): string {
    if (!this.student) return 'Non renseignée';
    
    if (this.student.orientation) {
      return this.student.orientation.orientation_type;
    }

    // Fallback avec les données de référence si nécessaire
    if (this.student.orientation_uuid && this.orientations.length > 0) {
      const orientation = this.orientations.find(o => o.id === this.student!.orientation_uuid);
      return orientation?.type || 'Non renseignée';
    }

    return 'Non renseignée';
  }

  getCurrentLevel(): { code: string; description: string } {
    if (!this.student) {
      return { code: '', description: '' };
    }

    // Si l'étudiant a des niveaux de sortie (progression), prendre le dernier
    if (this.student.exit_levels && this.student.exit_levels.length > 0) {
      const latestExitLevel = this.student.exit_levels[this.student.exit_levels.length - 1];
      return {
        code: latestExitLevel.french_level_code || '',
        description: latestExitLevel.french_level_description || ''
      };
    }

    // Sinon, retourner le niveau d'entrée
    if (this.student.frenchLevel) {
      return {
        code: this.student.frenchLevel.french_level_code,
        description: this.student.frenchLevel.french_level_description
      };
    }

    return { code: '', description: '' };
  }

  getRecentActivities() {
    // Pour l'instant, retourner un tableau vide car l'API ne semble pas fournir statusHistory
    return [];
  }

  // Placeholder action: affichage complet des notes (sera branché plus tard)
  viewNotes(): void {
    // À implémenter lors de la refonte des notes
  }

  getActivityIcon(field: string): string {
    const iconMap: { [key: string]: string } = {
      niveau: 'level',
      statut: 'status',
      email: 'contact',
      téléphone: 'contact',
      adresse: 'location',
    };

    return iconMap[field.toLowerCase()] || 'default';
  }

  changeLevel(): void {
    if (this.student) {
      // TODO: Implémenter le changement de niveau
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/apprenants']);
  }

  editStudent(): void {
    if (this.student) {
      this.router.navigate(['/dashboard/apprenants', this.student.student_uuid, 'edit']);
    }
  }

  deleteStudent(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('🗑️ Méthode deleteStudent appelée');
    
    if (!this.student) {
      console.log('❌ Aucun étudiant à supprimer');
      return;
    }
    
    console.log('🗑️ Suppression étudiant - ID:', this.student.student_uuid);
    console.log('🗑️ Suppression étudiant - Données:', this.student);
    
    // Afficher la modal de confirmation personnalisée
    this.showDeleteConfirmModal = true;
  }

  confirmDelete(): void {
    if (!this.student) return;
    
    console.log('🗑️ Suppression confirmée, appel API...');
    this.showDeleteConfirmModal = false;
    
    this.studentService.deleteStudent(this.student.student_uuid).subscribe({
      next: (response) => {
        console.log('✅ Suppression réussie:', response);
        this.router.navigate(['/dashboard/apprenants']);
      },
      error: (err) => {
        console.error('❌ Erreur lors de la suppression:', err);
        console.error('❌ Détails erreur:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          error: err.error
        });
        alert('Erreur lors de la suppression de l\'étudiant');
      }
    });
  }

  cancelDelete(): void {
    console.log('🗑️ Suppression annulée par l\'utilisateur');
    this.showDeleteConfirmModal = false;
  }

  // Méthodes liées aux attestations supprimées

  viewAbsences(): void {
    this.showAbsenceHistory = true;
  }

  addAbsence(): void {
    if (!this.student) return;
    
    const courseId = 'COURS_001'; // À remplacer par la vraie logique
    const absenceData = {
      student_id: this.student.student_uuid,
      course_id: courseId,
      date: new Date(),
      reason: 'Non renseigné'
    };
    
    // Simuler une notification
    alert(`Absence ajoutée:\nÉtudiant: ${this.student.student_firstname} ${this.student.student_lastname}\nCours: ${courseId}\nDate: ${new Date().toLocaleDateString()}`);
  }

  // ===== Absences récentes =====
  private loadRecentAbsences(): void {
    if (!this.student?.student_uuid) return;
    this.loadingAbsences = true;
    this.absencesError = null;
    this.attendanceService.getStudentAbsences(this.student.student_uuid).subscribe({
      next: (absences: any) => {
        const list: Absence[] = Array.isArray(absences) ? absences : (absences?.data || absences?.data?.data || []);
        const sorted = list.sort((a: Absence, b: Absence) =>
          new Date(b.course?.day || '').getTime() - new Date(a.course?.day || '').getTime()
        );
        this.recentAbsences = sorted.slice(0, 5);
        this.loadingAbsences = false;
      },
      error: (err) => {
        console.error('❌ Erreur chargement absences:', err);
        this.absencesError = 'Impossible de charger les absences';
        this.loadingAbsences = false;
      }
    });
  }

  // Utilitaires d'affichage (dates / libellés)
  formatTime(input?: string | Date | null): string {
    if (!input) return '';
    if (typeof input === 'string') {
      if (input.includes('T')) {
        const d = new Date(input);
        if (isNaN(d.getTime())) return input;
        return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      }
      // HH:MM[:SS]
      return input.substring(0, 5);
    }
    return new Date(input).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  getAbsenceLabel(a: Absence): string {
    if (!a) return '';
    if (a.absence_reason) return a.absence_reason;
    if ((a as any).absence_status === 'justified') return 'Justifiée';
    return 'Absence';
  }

  manageAbsences(): void {
    this.showAbsenceHistory = !this.showAbsenceHistory;
  }

  viewEvaluations(): void {
    // Fonctionnalité à implémenter
  }

  addEvaluation(): void {
    // Fonctionnalité à implémenter
  }

  manageEvaluations(): void {
    // Fonctionnalité à implémenter
  }



  // Méthodes examens supprimées

  formatExamDate(date: string | Date): string {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Styles/labels de statut notes retirés

  

  

  

  // Modal notes supprimée

  

  

  

  

  

  

  

  

  
}
