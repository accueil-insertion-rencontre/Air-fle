import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ExamService, StudentService, AlertService, GroupService } from '@core/services';
import { Exam, ExamDisplayInfo, CreateExamDto, UpdateExamDto, Student, Group } from '@core/models';

@Component({
  selector: 'app-examens',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './examens.component.html',
  styleUrls: ['./examens.component.scss']
})
export class ExamensComponent implements OnInit, OnDestroy {
  // Math pour la pagination
  Math = Math;
  
  // Loading states
  isLoading = true;
  isCreating = false;
  isDeleting = false;
  isUpdating = false;

  // Data
  exams: Exam[] = [];
  students: Student[] = [];
  groups: Group[] = [];
  filteredExams: ExamDisplayInfo[] = [];

  // UI state
  showCreateForm = false;
  showEditForm = false;
  showDeleteConfirm = false;
  showManageStudents = false;
  showAddGroupForm = false;
  showEditStudentScore = false;
  showAddOptionsModal = false;
  showAddStudentForm = false;
  // expansion dans la ligne d'examen
  expandedExamId: string | null = null;
  // pagination pour le détail
  detailsPage = 1;
  detailsPageSize = 10;
  detailsTotal = 0;
  detailsStudents: any[] = [];
  detailsEditable = false;
  // édition inline d'une note
  editingStudentUuid: string | null = null;
  inlineEdit = { score: '', status: 'pending' as 'pending' | 'passed' | 'failed' | 'absent', notes: '' };
  // panneau d'ajout
  addOptionsExamId: string | null = null;
  // panneau d'édition
  editOptionsExamId: string | null = null;
  editInlineExamId: string | null = null;
  currentAddMode: 'students' | 'group' | null = null;
  selectedExam: Exam | null = null;
  selectedStudent: any = null;
  examToDelete: ExamDisplayInfo | null = null;
  searchTerm = '';
  studentSearchTerm = '';
  studentSortBy: 'name' | 'email' | 'group' = 'name';
  studentSortDirection: 'asc' | 'desc' = 'asc';
  currentStudentPage = 1;
  studentsPerPage = 20;
  totalStudentItems = 0;
  totalStudentPages = 1;
  selectedStudents: string[] = [];
  sortBy: 'date' | 'student' | 'score' = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Forms
  examForm: FormGroup;
  editForm: FormGroup;
  addStudentForm: FormGroup;
  addGroupForm: FormGroup;
  editStudentScoreForm: FormGroup;

  // Error handling
  error: string | null = null;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private examService: ExamService,
    private studentService: StudentService,
    private groupService: GroupService,
    private alertService: AlertService,
    private fb: FormBuilder
  ) {
    this.examForm = this.createExamForm();
    this.editForm = this.createEditForm();
    this.addStudentForm = this.createAddStudentForm();
    this.addGroupForm = this.createAddGroupForm();
    this.editStudentScoreForm = this.createEditStudentScoreForm();
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Charge les données initiales
   */
  private loadInitialData(): void {
    this.isLoading = true;
    this.error = null;

    // Charger les examens et les étudiants en parallèle
    const examsSub = this.examService.getAllExams().subscribe({
      next: (response) => {

        // L'API peut retourner un objet avec une propriété contenant le tableau
        const responseData = response as any; // Assertion de type pour éviter les erreurs TypeScript
        
        if (Array.isArray(responseData)) {
          this.exams = responseData; 
        } else if (responseData && Array.isArray(responseData.data)) {
          this.exams = responseData.data;
        } else if (responseData && Array.isArray(responseData.exams)) {
          this.exams = responseData.exams;
        } else {
          console.warn('Format de réponse inattendu pour les examens:', responseData);
          this.exams = [];
        }
        this.updateFilteredExams();
      },
      error: (error) => {
        console.error('❌ ExamensComponent: Erreur lors du chargement des examens:', error);
        this.error = 'Impossible de charger les examens. ' + error.message;
        this.isLoading = false;
      }
    });

    const studentsSub = this.studentService.getStudents().subscribe({
      next: (response) => {

        this.students = response.students || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ ExamensComponent: Erreur lors du chargement des étudiants:', error);
        this.alertService.error('Impossible de charger la liste des étudiants');
        this.isLoading = false;
      }
    });

    const groupsSub = this.groupService.getGroups().subscribe({
      next: (groups: Group[]) => {
        console.log('📋 ExamensComponent: Groupes chargés:', groups);
        this.groups = groups;
      },
      error: (error: any) => {
        console.error('❌ ExamensComponent: Erreur lors du chargement des groupes:', error);
        this.alertService.error('Impossible de charger la liste des groupes');
      }
    });

    this.subscriptions.push(examsSub, studentsSub, groupsSub);
  }

  /**
   * Met à jour la liste filtrée des examens
   */
  private updateFilteredExams(): void {
    if (!Array.isArray(this.exams)) {
      console.warn('Les examens ne sont pas un tableau:', this.exams);
      this.filteredExams = [];
      return;
    }
    
          // Enrichir les examens avec les données des étudiants si nécessaire
      const enrichedExams = this.exams.map(exam => {
        // Pour la nouvelle structure, on peut avoir plusieurs étudiants
        if (exam.students && exam.students.length > 0) {
          // Nouvelle structure - les étudiants sont déjà inclus
          return exam;
        } else {
          // Ancienne structure ou pas d'étudiants
          return exam;
        }
      });
    
    let filtered = this.examService.getExamsDisplayInfo(enrichedExams);

    // Filtrage par terme de recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(exam => 
        exam.label.toLowerCase().includes(term) ||
        exam.studentName.toLowerCase().includes(term) ||
        (exam.score && exam.score.toLowerCase().includes(term))
      );
    }

    // Tri
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (this.sortBy) {
        case 'date':
          compareValue = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'student':
          compareValue = a.studentName.localeCompare(b.studentName);
          break;
        case 'score': {
          const scoreA = a.score || '';
          const scoreB = b.score || '';
          compareValue = scoreA.localeCompare(scoreB);
          break;
        }
      }

      return this.sortDirection === 'desc' ? -compareValue : compareValue;
    });

    this.filteredExams = filtered;
  }

  openExamDetails(exam: ExamDisplayInfo): void {
    // Fermer les anciens panneaux/modalités hérités
    this.showManageStudents = false;
    this.showCreateForm = false;
    this.showEditForm = false;
    this.showAddGroupForm = false;
    this.showEditStudentScore = false;
    this.showAddOptionsModal = false;
    this.editOptionsExamId = null;
    this.addOptionsExamId = null;
    this.currentAddMode = null;
    this.detailsEditable = false;
    this.editingStudentUuid = null;

    if (this.expandedExamId === exam.id) {
      // Toggle: fermer si déjà ouvert
      this.expandedExamId = null;
      this.selectedExam = null;
      return;
    }

    const found = this.exams.find(e => e.exam_uuid === exam.id);
    if (!found) return;
    this.selectedExam = found;
    this.expandedExamId = exam.id;
    this.detailsPage = 1;
    this.loadExamDetailsPage();
  }

  openAddOptions(exam: ExamDisplayInfo): void {
    // Fermer les autres panneaux
    this.expandedExamId = null;
    this.showManageStudents = false;
    this.showCreateForm = false;
    this.showEditForm = false;
    this.showAddGroupForm = false;
    this.showEditStudentScore = false;
    this.showAddOptionsModal = false;
    this.editOptionsExamId = null;
    this.editInlineExamId = null;
    this.detailsEditable = false;
    this.editingStudentUuid = null;

    if (this.addOptionsExamId === exam.id) {
      // Toggle
      this.addOptionsExamId = null;
      this.currentAddMode = null;
      this.selectedExam = null;
      return;
    }

    const found = this.exams.find(e => e.exam_uuid === exam.id);
    if (!found) return;
    this.selectedExam = found;
    this.addOptionsExamId = exam.id;
    this.currentAddMode = null;
  }

  openEditOptions(exam: ExamDisplayInfo): void {
    // Fermer les autres panneaux
    this.expandedExamId = null;
    this.addOptionsExamId = null;
    this.currentAddMode = null;
    this.showManageStudents = false;
    this.showCreateForm = false;
    this.showEditForm = false;
    this.showAddGroupForm = false;
    this.showEditStudentScore = false;
    this.editInlineExamId = null;
    this.detailsEditable = false;
    this.editingStudentUuid = null;

    if (this.editOptionsExamId === exam.id) {
      this.editOptionsExamId = null;
      this.selectedExam = null;
      return;
    }

    const found = this.exams.find(e => e.exam_uuid === exam.id);
    if (!found) return;
    this.selectedExam = found;
    this.editOptionsExamId = exam.id;
  }

  chooseEditExam(): void {
    if (!this.selectedExam) return;
    this.editOptionsExamId = null;
    // Ouvre l'édition inline sous la carte d'examen
    this.editInlineExamId = this.selectedExam.exam_uuid;
    this.editForm.reset();
    this.editForm.patchValue({
      exam_label: this.selectedExam.exam_label,
      exam_type: this.selectedExam.exam_type || 'written'
    });
  }

  chooseEditNotes(): void {
    if (!this.selectedExam) return;
    this.editOptionsExamId = null;
    // Ouvre le panneau de détails inline (participants/notes)
    const display: ExamDisplayInfo = {
      id: this.selectedExam.exam_uuid,
      label: this.selectedExam.exam_label,
      date: this.selectedExam.exam_taked_at as any,
      studentName: '',
      score: '',
      type: this.selectedExam.exam_type
    } as any;
    this.detailsEditable = true;
    this.editingStudentUuid = null;
    // ouvre le panneau détails sur l'examen ciblé
    if (this.expandedExamId !== display.id) {
      this.openExamDetails(display);
      this.detailsEditable = true; // rétablir après openExamDetails qui force false
    } else {
      // déjà ouvert en vue, on active simplement le mode édition
      this.detailsEditable = true;
    }
  }

  // Début édition inline d'une note
  startInlineEdit(student: any): void {
    this.editingStudentUuid = student.student_uuid;
    this.inlineEdit = {
      score: student.score || '',
      status: (student.status || 'pending') as any,
      notes: student.notes || ''
    };
  }

  cancelInlineEdit(): void {
    this.editingStudentUuid = null;
  }

  saveInlineEdit(student: any): void {
    if (!this.selectedExam) return;
    const payload = {
      exam_score: this.inlineEdit.score || undefined,
      exam_status: this.inlineEdit.status,
      exam_notes: this.inlineEdit.notes || undefined
    };
    this.examService.updateStudentExamScore(
      student.student_uuid,
      this.selectedExam.exam_uuid,
      payload
    ).subscribe({
      next: _ => {
        // mettre à jour localement pour feedback instantané
        const idx = this.detailsStudents.findIndex(d => d.student_uuid === student.student_uuid);
        if (idx > -1) {
          this.detailsStudents[idx] = {
            ...this.detailsStudents[idx],
            score: this.inlineEdit.score,
            status: this.inlineEdit.status,
            notes: this.inlineEdit.notes
          };
        }
        this.alertService.success('Note mise à jour');
        this.editingStudentUuid = null;
      },
      error: err => {
        console.error('❌ Erreur maj note:', err);
        this.alertService.error('Impossible de mettre à jour la note');
      }
    });
  }

  removeStudentInline(student: any): void {
    if (!this.selectedExam) return;
    this.examService.removeStudentFromExam(student.student_uuid, this.selectedExam.exam_uuid)
      .subscribe({
        next: _ => {
          this.detailsStudents = this.detailsStudents.filter(d => d.student_uuid !== student.student_uuid);
          this.detailsTotal = Math.max(0, this.detailsTotal - 1);
          // Mettre à jour la source de vérité locale pour l'examen courant
          if ((this.selectedExam as any).students) {
            (this.selectedExam as any).students = (this.selectedExam as any).students.filter((se: any) => se.student_uuid !== student.student_uuid);
          }
          this.alertService.success('Étudiant retiré de l\'examen');
        },
        error: err => {
          console.error('❌ Erreur suppression étudiant:', err);
          this.alertService.error('Impossible de retirer l\'étudiant de l\'examen');
        }
      });
  }

  setAddMode(mode: 'students' | 'group'): void {
    this.currentAddMode = mode;
    if (mode === 'students') {
      this.studentSearchTerm = '';
      this.selectedStudents = [];
      this.currentStudentPage = 1;
      this.loadStudentsForExam();
    } else if (mode === 'group') {
      this.addGroupForm.reset();
    }
  }

  loadExamDetailsPage(): void {
    if (!this.selectedExam) return;
    this.examService.getExamStudentsPaginated(this.selectedExam.exam_uuid, this.detailsPage, this.detailsPageSize)
      .subscribe({
        next: res => {
          const mapped = (res.data || []).map((s: any) => ({
            student_uuid: s.student_uuid,
            name: (s.student?.student_firstname || '') + ' ' + (s.student?.student_lastname || ''),
            email: s.student?.student_mail,
            score: s.exam_score,
            status: s.exam_status,
            notes: s.exam_notes,
          }));
          this.detailsStudents = mapped;
          this.detailsTotal = res.meta?.total ?? mapped.length;
          this.detailsPage = res.meta?.page || this.detailsPage;
          this.detailsPageSize = res.meta?.pageSize || this.detailsPageSize;
        },
        error: _ => {
          // En cas d'erreur API, on affiche une liste vide mais sans fallback local
          this.detailsStudents = [];
          this.detailsTotal = 0;
        }
      });
  }

  onDetailsPageChange(page: number): void {
    if (page < 1) return;
    const totalPages = Math.max(1, Math.ceil(this.detailsTotal / this.detailsPageSize));
    if (page > totalPages) return;
    this.detailsPage = page;
    this.loadExamDetailsPage();
  }

  /**
   * Crée le formulaire d'examen
   */
  private createExamForm(): FormGroup {
    return this.fb.group({
      exam_label: ['', [Validators.required, Validators.minLength(3)]],
      exam_taked_at: ['', Validators.required],
      exam_type: ['written']
      // PAS d'étudiants ici - ils seront ajoutés séparément !
    });
  }

  /**
   * Crée le formulaire d'édition simplifié
   */
  private createEditForm(): FormGroup {
    return this.fb.group({
      exam_label: ['', [Validators.required, Validators.minLength(3)]],
      exam_type: ['written']
    });
  }

  /**
   * Crée le formulaire pour ajouter un étudiant à un examen
   */
  private createAddStudentForm(): FormGroup {
    return this.fb.group({
      student_uuid: ['', Validators.required],
      exam_score: [''],
      exam_status: ['pending'],
      exam_notes: ['']
    });
  }

  private createAddGroupForm(): FormGroup {
    return this.fb.group({
      group_uuid: ['', Validators.required],
      default_score: [''],
      default_status: ['pending']
    });
  }

  private createEditStudentScoreForm(): FormGroup {
    return this.fb.group({
      exam_score: [''],
      exam_status: ['pending'],
      exam_notes: ['']
    });
  }

  /**
   * Gère le changement de terme de recherche
   */
  onSearchChange(): void {
    this.updateFilteredExams();
  }

  /**
   * Change le tri
   */
  onSortChange(field: 'date' | 'student' | 'score'): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'desc';
    }
    this.updateFilteredExams();
  }

  /**
   * Affiche le formulaire de création
   */
  showCreateExamForm(): void {
    this.showCreateForm = true;
    this.showEditForm = false;
    this.examForm.reset();
    this.selectedExam = null;
    this.error = null;
  }

  /**
   * Cache le formulaire de création
   */
  hideCreateForm(): void {
    this.showCreateForm = false;
    this.examForm.reset();
    this.selectedExam = null;
    this.error = null;
  }

  /**
   * Affiche le formulaire d'édition
   */
  showEditExamForm(exam: ExamDisplayInfo): void {
    const originalExam = this.exams.find(e => e.exam_uuid === exam.id);
    if (!originalExam) return;

    this.selectedExam = originalExam;
    this.showEditForm = true;
    this.showCreateForm = false;
    this.error = null;

    // Pré-remplir seulement les champs modifiables
    this.editForm.patchValue({
      exam_label: originalExam.exam_label,
      exam_type: originalExam.exam_type || 'written'
    });
  }

  /**
   * Cache le formulaire d'édition
   */
  hideEditForm(): void {
    this.showEditForm = false;
    this.editForm.reset();
    this.selectedExam = null;
    this.error = null;
  }

  /**
   * Affiche le formulaire de gestion des étudiants
   */
  showManageStudentsForm(examDisplay: ExamDisplayInfo): void {
    // Trouver l'examen complet dans la liste
    const exam = this.exams.find(e => e.exam_uuid === examDisplay.id);
    if (exam) {
      this.selectedExam = exam;
      this.showManageStudents = true;
      this.showCreateForm = false;
      this.showEditForm = false;
      this.error = null;
    }
  }

  /**
   * Cache le formulaire de gestion des étudiants
   */
  hideManageStudentsForm(): void {
    this.showManageStudents = false;
    this.addStudentForm.reset();
    this.selectedExam = null;
    this.error = null;
  }

  openAddGroupForm(examDisplay: ExamDisplayInfo): void {
    // Trouver l'examen complet dans la liste
    const exam = this.exams.find(e => e.exam_uuid === examDisplay.id);
    if (exam) {
      this.selectedExam = exam;
      this.showAddGroupForm = true;
      this.showCreateForm = false;
      this.showEditForm = false;
      this.showManageStudents = false;
      this.error = null;
    }
  }

  hideAddGroupForm(): void {
    this.showAddGroupForm = false;
    this.selectedExam = null;
    this.addGroupForm.reset();
    this.error = null;
  }

  onAddGroupToExam(): void {
    if (this.addGroupForm.valid && this.selectedExam) {
      const formValue = this.addGroupForm.value;
      
      console.log('🔍 ExamensComponent: Ajout groupe à l\'examen:', {
        examUuid: this.selectedExam.exam_uuid,
        groupUuid: formValue.group_uuid,
        defaultScore: formValue.default_score,
        defaultStatus: formValue.default_status
      });
      
      this.examService.addGroupToExam(
        this.selectedExam.exam_uuid,
        formValue.group_uuid,
        formValue.default_score || undefined,
        formValue.default_status || undefined
      ).subscribe({
        next: (response) => {
          console.log('✅ ExamensComponent: Groupe ajouté avec succès:', response);
          this.alertService.success('Groupe ajouté à l\'examen avec succès !');
          this.hideAddGroupForm();
          this.loadInitialData(); // Recharger les données
        },
        error: (error) => {
          console.error('❌ Erreur lors de l\'ajout du groupe:', error);
          this.alertService.error('Erreur lors de l\'ajout du groupe à l\'examen');
        }
      });
    } else {
      this.markFormGroupTouched(this.addGroupForm);
    }
  }

  showEditStudentScoreForm(student: any): void {
    this.selectedStudent = student;
    this.showEditStudentScore = true;
    this.showManageStudents = false;
    this.showCreateForm = false;
    this.showEditForm = false;
    this.showAddGroupForm = false;
    this.error = null;
    
    // Pré-remplir le formulaire avec les valeurs actuelles
    this.editStudentScoreForm.patchValue({
      exam_score: student.exam_score || '',
      exam_status: student.exam_status || 'pending',
      exam_notes: student.exam_notes || ''
    });
  }

  hideEditStudentScoreForm(): void {
    this.showEditStudentScore = false;
    this.selectedStudent = null;
    this.editStudentScoreForm.reset();
    this.error = null;
  }

  onUpdateStudentScore(): void {
    if (this.editStudentScoreForm.valid && this.selectedExam && this.selectedStudent) {
      const formValue = this.editStudentScoreForm.value;
      
      console.log('🔍 ExamensComponent: Mise à jour note étudiant:', {
        examUuid: this.selectedExam.exam_uuid,
        studentUuid: this.selectedStudent.student_uuid,
        score: formValue.exam_score,
        status: formValue.exam_status,
        notes: formValue.exam_notes
      });
      
      this.examService.updateStudentExamScore(
        this.selectedStudent.student_uuid,
        this.selectedExam.exam_uuid,
        {
          exam_score: formValue.exam_score || undefined,
          exam_status: formValue.exam_status,
          exam_notes: formValue.exam_notes || undefined
        }
      ).subscribe({
        next: (response) => {
          console.log('✅ ExamensComponent: Note mise à jour avec succès:', response);
          this.alertService.success('Note de l\'étudiant mise à jour avec succès !');
          this.hideEditStudentScoreForm();
          this.loadInitialData(); // Recharger les données
        },
        error: (error) => {
          console.error('❌ Erreur lors de la mise à jour de la note:', error);
          this.alertService.error('Erreur lors de la mise à jour de la note');
        }
      });
    } else {
      this.markFormGroupTouched(this.editStudentScoreForm);
    }
  }

  viewGroup(examUuid: string): void {
    // Trouver l'examen par son UUID
    const exam = this.exams.find(e => e.exam_uuid === examUuid);
    if (exam) {
      this.selectedExam = exam;
      this.showManageStudents = true;
      this.showCreateForm = false;
      this.showEditForm = false;
      this.showAddGroupForm = false;
      this.showEditStudentScore = false;
      this.showAddOptionsModal = false;
      this.error = null;
    }
  }

  openAddOptionsModal(examUuid: string): void {
    console.log('🔍 openAddOptionsModal appelé avec examUuid:', examUuid);
    console.log('📋 this.exams:', this.exams);
    
    // Trouver l'examen par son UUID
    const exam = this.exams.find(e => e.exam_uuid === examUuid);
    if (exam) {
      console.log('✅ Examen trouvé:', exam);
      this.selectedExam = exam;
      this.showAddOptionsModal = true;
      this.showCreateForm = false;
      this.showEditForm = false;
      this.showManageStudents = false;
      this.showAddGroupForm = false;
      this.showEditStudentScore = false;
      this.error = null;
    } else {
      console.error('❌ Examen non trouvé avec UUID:', examUuid);
      console.log('🔍 UUIDs disponibles dans this.exams:', this.exams.map(e => e.exam_uuid));
      this.alertService.error('Examen non trouvé');
    }
  }

  hideAddOptionsModal(): void {
    this.showAddOptionsModal = false;
    this.selectedExam = null;
    this.error = null;
  }

  addStudentToExamFromModal(): void {
    // Sauvegarder selectedExam avant de fermer le modal
    const currentSelectedExam = this.selectedExam;
    
    this.hideAddOptionsModal();
    this.showAddStudentForm = true;
    this.showCreateForm = false;
    this.showEditForm = false;
    this.showManageStudents = false;
    this.showAddGroupForm = false;
    this.showEditStudentScore = false;
    this.error = null;
    this.studentSearchTerm = '';
    this.currentStudentPage = 1;
    this.selectedStudents = [];
    
    // Restaurer selectedExam
    this.selectedExam = currentSelectedExam;
    
    // S'assurer que selectedExam est défini
    if (!this.selectedExam) {
      console.error('❌ selectedExam est null dans addStudentToExamFromModal');
      this.alertService.error('Erreur: aucun examen sélectionné');
      return;
    }
    
    console.log('✅ selectedExam restauré:', this.selectedExam);
    this.loadStudentsForExam();
  }

  addGroupToExamFromModal(): void {
    this.hideAddOptionsModal();
    this.showAddGroupForm = true;
  }

  hideAddStudentForm(): void {
    this.showAddStudentForm = false;
    this.selectedExam = null;
    this.addStudentForm.reset();
    this.studentSearchTerm = '';
    this.selectedStudents = [];
    this.error = null;
  }

  onStudentSearchChange(): void {
    this.currentStudentPage = 1; // Retour à la première page
    this.loadStudentsForExam();
  }

  loadStudentsForExam(): void {
    // Créer les filtres pour la recherche
    const filters: any = {};
    if (this.studentSearchTerm.trim()) {
      filters.student_firstname = this.studentSearchTerm;
      filters.student_lastname = this.studentSearchTerm;
      filters.student_mail = this.studentSearchTerm;
    }

    // Créer la configuration pour l'API
    const config = {
      page: this.currentStudentPage,
      pageSize: this.studentsPerPage,
      filters: filters,
      sort: undefined // Pas de tri côté API pour l'instant
    };

    this.studentService.getStudents(config).subscribe({
      next: (result: any) => {
        console.log('🔍 Réponse API étudiants:', result);
        this.students = result.students || [];
        this.totalStudentItems = result.total || result.totalItems || 0;
        this.totalStudentPages = Math.ceil(this.totalStudentItems / this.studentsPerPage);
        console.log('📊 Pagination étudiants:', {
          totalItems: this.totalStudentItems,
          totalPages: this.totalStudentPages,
          currentPage: this.currentStudentPage,
          studentsPerPage: this.studentsPerPage
        });
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des étudiants:', error);
        this.alertService.error('Erreur lors du chargement des étudiants');
        // Initialiser avec des valeurs par défaut en cas d'erreur
        this.totalStudentItems = 0;
        this.totalStudentPages = 1;
      }
    });
  }

  getPaginatedStudents(): Student[] {
    return this.students;
  }

  // Vérifie si un étudiant est déjà inscrit à l'examen sélectionné
  isStudentAlreadyInExam(studentUuid: string): boolean {
    if (!this.selectedExam) return false;
    const participantsFromExam: any[] = Array.isArray((this.selectedExam as any).students)
      ? (this.selectedExam as any).students
      : [];
    const participantsFromDetails: any[] = Array.isArray(this.detailsStudents) ? this.detailsStudents : [];
    return (
      participantsFromExam.some((se: any) => se.student_uuid === studentUuid) ||
      participantsFromDetails.some((se: any) => se.student_uuid === studentUuid)
    );
  }

  getTotalStudentPages(): number {
    return this.totalStudentPages;
  }

  getStudentDisplayRange(): string {
    const start = (this.currentStudentPage - 1) * this.studentsPerPage + 1;
    const end = Math.min(this.currentStudentPage * this.studentsPerPage, this.totalStudentItems || 0);
    
    // Protection contre les valeurs NaN
    if (isNaN(start) || isNaN(end) || start > end) {
      return '0 - 0';
    }
    
    return `${start} - ${end}`;
  }

  getStudentPageNumbers(): number[] {
    const totalPages = this.getTotalStudentPages();
    if (totalPages <= 0) return [];
    
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  getSmartStudentPageNumbers(): (number | string)[] {
    const totalPages = this.getTotalStudentPages();
    if (totalPages <= 0) return [];
    
    const currentPage = this.currentStudentPage;
    const pages: (number | string)[] = [];
    
    // Si moins de 10 pages, afficher toutes
    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }
    
    // Logique pour les pages avec ellipses
    const delta = 2; // Nombre de pages à afficher de chaque côté de la page courante
    
    // Toujours afficher la première page
    pages.push(1);
    
    // Si on est loin du début, ajouter des ellipses
    if (currentPage > delta + 3) {
      pages.push('...');
    }
    
    // Pages autour de la page courante
    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    // Si on est loin de la fin, ajouter des ellipses
    if (currentPage < totalPages - delta - 2) {
      pages.push('...');
    }
    
    // Toujours afficher la dernière page (sauf si c'est la page 1)
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  }

  onStudentPageChange(page: number | string): void {
    // Ignorer les ellipses
    if (page === '...') {
      return;
    }
    
    const pageNumber = page as number;
    if (pageNumber >= 1 && pageNumber <= this.getTotalStudentPages()) {
      this.currentStudentPage = pageNumber;
      this.loadStudentsForExam();
    }
  }

  onStudentSortChange(field: 'name' | 'email' | 'group'): void {
    if (this.studentSortBy === field) {
      this.studentSortDirection = this.studentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.studentSortBy = field;
      this.studentSortDirection = 'asc';
    }
    this.currentStudentPage = 1; // Retour à la première page
    this.loadStudentsForExam();
  }

  toggleStudentSelection(studentUuid: string): void {
    // Éviter la sélection si déjà inscrit à l'examen
    if (this.isStudentAlreadyInExam(studentUuid)) {
      return;
    }
    const index = this.selectedStudents.indexOf(studentUuid);
    if (index > -1) {
      this.selectedStudents.splice(index, 1);
    } else {
      this.selectedStudents.push(studentUuid);
    }
  }

  isStudentSelected(studentUuid: string): boolean {
    return this.selectedStudents.includes(studentUuid);
  }

  selectAllStudents(): void {
    const currentStudents = this.getPaginatedStudents();
    this.selectedStudents = currentStudents.map(s => s.student_uuid);
  }

  deselectAllStudents(): void {
    this.selectedStudents = [];
  }

  addSelectedStudentsToExam(): void {
    if (this.selectedStudents.length === 0) {
      this.alertService.error('Veuillez sélectionner au moins un étudiant');
      return;
    }

    if (!this.selectedExam) {
      this.alertService.error('Aucun examen sélectionné');
      return;
    }

    if (!this.selectedExam.exam_uuid) {
      this.alertService.error('ID de l\'examen manquant');
      return;
    }

    // Filtrer les étudiants déjà inscrits
    const toAdd = this.selectedStudents.filter(uuid => !this.isStudentAlreadyInExam(uuid));

    if (toAdd.length === 0) {
      this.alertService.info('Tous les étudiants sélectionnés sont déjà inscrits à cet examen.');
      return;
    }

    // Ajouter uniquement les étudiants non encore inscrits
    const promises = toAdd.map(studentUuid => {
      const examStudentData = {
        student_uuid: studentUuid,
        exam_uuid: this.selectedExam!.exam_uuid, // On sait que selectedExam n'est pas null grâce aux vérifications ci-dessus
        exam_score: this.addStudentForm.value.exam_score || null,
        exam_status: this.addStudentForm.value.exam_status,
        exam_notes: this.addStudentForm.value.exam_notes || null
      };

      return this.examService.addStudentToExam(examStudentData).toPromise();
    });

    Promise.all(promises).then(() => {
      const ignored = this.selectedStudents.length - toAdd.length;
      const suffix = ignored > 0 ? ` (${ignored} déjà inscrit(s) ignoré(s))` : '';
      this.alertService.success(`${toAdd.length} étudiant(s) ajouté(s) à l'examen avec succès${suffix}`);
      this.selectedStudents = [];
      this.hideAddStudentForm();
      this.loadInitialData();
    }).catch(error => {
      console.error('❌ Erreur lors de l\'ajout des étudiants:', error);
      this.alertService.error('Erreur lors de l\'ajout des étudiants');
    });
  }

  /**
   * Ajoute un étudiant à un examen
   */
  onAddStudentToExam(): void {
    if (this.addStudentForm.valid && this.selectedExam) {
      const formData = this.addStudentForm.value;
      
      const examStudentData = {
        student_uuid: formData.student_uuid,
        exam_uuid: this.selectedExam.exam_uuid,
        exam_score: formData.exam_score || null,
        exam_status: formData.exam_status,
        exam_notes: formData.exam_notes || null
      };

      this.examService.addStudentToExam(examStudentData).subscribe({
        next: (response) => {
          this.alertService.success('Étudiant ajouté à l\'examen avec succès !');
          this.addStudentForm.reset();
          // Recharger les données de l'examen
          this.loadInitialData();
        },
        error: (error) => {
          console.error('❌ Erreur lors de l\'ajout de l\'étudiant:', error);
          this.error = error.message;
        }
      });
    } else {
      this.markFormGroupTouched(this.addStudentForm);
    }
  }

  /**
   * Crée un nouvel examen
   */
  onCreateExam(): void {
    if (this.examForm.valid && !this.isCreating) {
      this.isCreating = true;
      this.error = null;

      // Créer UNIQUEMENT l'examen (sans étudiants ni notes)
      const examData: CreateExamDto = {
        exam_label: this.examForm.value.exam_label,
        exam_taked_at: new Date(this.examForm.value.exam_taked_at),
        exam_type: this.examForm.value.exam_type || 'written'
        // PAS de students ici !
      };

      const createSub = this.examService.createExam(examData).subscribe({
        next: (newExam) => {
          this.exams.push(newExam);
          this.updateFilteredExams();
          this.hideCreateForm();
          this.alertService.success('Examen créé avec succès ! Vous pouvez maintenant ajouter des étudiants.');
          this.isCreating = false;
        },
        error: (error) => {
          console.error('❌ ExamensComponent: Erreur lors de la création:', error);
          this.error = error.message;
          this.isCreating = false;
        }
      });

      this.subscriptions.push(createSub);
    } else {
      this.markFormGroupTouched(this.examForm);
    }
  }

  /**
   * Met à jour un examen existant
   */
  onUpdateExam(): void {
    if (this.editForm.valid && !this.isUpdating && this.selectedExam) {
      this.isUpdating = true;
      this.error = null;

      // On ne met à jour que les champs modifiables, en gardant les valeurs originales pour les autres
      const examData: UpdateExamDto = {
        exam_label: this.editForm.value.exam_label,
        exam_type: this.editForm.value.exam_type || 'written'
        // Garder les étudiants existants
      };

      const updateSub = this.examService.updateExam(this.selectedExam.exam_uuid, examData).subscribe({
        next: (updatedExam) => {
          const index = this.exams.findIndex(e => e.exam_uuid === updatedExam.exam_uuid);
          if (index !== -1) {
            this.exams[index] = updatedExam;
          }
          this.updateFilteredExams();
          this.hideEditForm();
          this.alertService.success('Examen mis à jour avec succès !');
          this.isUpdating = false;
        },
        error: (error) => {
          console.error('❌ ExamensComponent: Erreur lors de la mise à jour:', error);
          this.error = error.message;
          this.isUpdating = false;
        }
      });

      this.subscriptions.push(updateSub);
    } else {
      this.markFormGroupTouched(this.editForm);
    }
  }

  /**
   * Supprime un examen
   */
  onDeleteExam(exam: ExamDisplayInfo): void {
    this.examToDelete = exam;
    this.showDeleteConfirm = true;
  }

  /**
   * Confirme la suppression d'un examen
   */
  confirmDelete(): void {
    if (this.examToDelete) {
      this.isDeleting = true;

      const deleteSub = this.examService.deleteExam(this.examToDelete.id).subscribe({
        next: () => {
          
          this.exams = this.exams.filter(e => e.exam_uuid !== this.examToDelete!.id);
          this.updateFilteredExams();
          this.alertService.success('Examen supprimé avec succès !');
          this.isDeleting = false;
          this.examToDelete = null;
          this.showDeleteConfirm = false;
        },
        error: (error) => {
          console.error('❌ ExamensComponent: Erreur lors de la suppression:', error);
          this.alertService.error('Erreur lors de la suppression : ' + error.message);
          this.isDeleting = false;
          this.examToDelete = null;
          this.showDeleteConfirm = false;
        }
      });

      this.subscriptions.push(deleteSub);
    }
  }

  /**
   * Annule la suppression d'un examen
   */
  cancelDelete(): void {
    this.examToDelete = null;
    this.showDeleteConfirm = false;
  }

  /**
   * Rafraîchit les données
   */
  onRefresh(): void {
    this.loadInitialData();
  }

  /**
   * Obtient le nom d'un étudiant à partir de son UUID
   */
  getStudentName(studentUuid: string): string {
    const student = this.students.find(s => s.student_uuid === studentUuid);
    return student ? `${student.student_firstname} ${student.student_lastname}` : 'Étudiant inconnu';
  }

  /**
   * Obtient le nombre total d'examens
   */
  getTotalExams(): number {
    if (!Array.isArray(this.exams)) {
      return 0;
    }
    return this.exams.length;
  }

  /**
   * Obtient le nombre d'examens avec notes
   */
  getExamsWithScores(): number {
    if (!Array.isArray(this.exams)) {
      return 0;
    }
    // Pour la nouvelle structure, on compte les examens qui ont des étudiants avec des scores
    return this.exams.filter(exam => {
      if (exam.students && exam.students.length > 0) {
        return exam.students.some(student => student.exam_score && student.exam_score.trim());
      }
      return false;
    }).length;
  }

  /**
   * Obtient le nom affiché de l'étudiant sélectionné pour l'édition
   */
  getStudentDisplayName(): string {
    if (!this.selectedExam) return 'Aucun étudiant sélectionné';
    
    // Pour la nouvelle structure, on peut avoir plusieurs étudiants
    if (this.selectedExam.students && this.selectedExam.students.length > 0) {
      const firstStudent = this.selectedExam.students[0];
      const student = firstStudent.student;
      if (student) {
        return `${student.student_firstname} ${student.student_lastname}`;
      }
      return `Étudiant (ID: ${firstStudent.student_uuid})`;
    }
    
    return 'Aucun étudiant associé';
  }

  /**
   * Marque tous les champs du formulaire comme touchés
   */
  private markFormGroupTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.markAsTouched();
    });
  }

  /**
   * Vérifie si un champ du formulaire a une erreur
   */
  hasFieldError(fieldName: string, form: FormGroup = this.examForm): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Obtient le message d'erreur pour un champ
   */
  getFieldError(fieldName: string, form: FormGroup = this.examForm): string {
    const field = form.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return 'Ce champ est obligatoire';
      }
      if (field.errors['minlength']) {
        return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      }
    }
    return '';
  }

  /**
   * TrackBy function pour optimiser le rendu de la liste
   */
  trackByExamId(index: number, exam: ExamDisplayInfo): string {
    return exam.id;
  }

  /**
   * Vérifie si l'examen sélectionné a des étudiants
   */
  hasStudents(): boolean {
    return (this.selectedExam?.students?.length || 0) > 0;
  }

  /**
   * Obtient le nombre d'étudiants de l'examen sélectionné
   */
  getStudentsCount(): number {
    return this.selectedExam?.students?.length || 0;
  }
} 