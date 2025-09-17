import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, startWith } from 'rxjs/operators';

import { 
  Continuation, 
  CreateContinuationDto,
  UpdateContinuationDto,
  ContinuationStats
} from '@core/models';
import { 
  ContinuationService,
  StudentService,
  AlertService
} from '@core/services';
import { Student, StudentListResponse } from '@core/models';

@Component({
  selector: 'app-parcours',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './parcours.component.html',
  styleUrls: ['./parcours.component.scss']
})
export class ParcoursComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data properties - TOUJOURS initialiser comme tableau
  continuations: Continuation[] = [];
  filteredContinuations: Continuation[] = [];
  continuationStats: ContinuationStats | null = null;

  // Reference data
  students: Student[] = [];

  // UI state
  viewMode: 'cards' | 'list' = 'cards';
  isLoading = false;
  isLoadingStats = false;
  isCreating = false;
  isEditing = false;
  error: string | null = null;

  // Form state
  showCreateForm = false;
  showEditForm = false;
  selectedContinuation: Continuation | null = null;

  // Forms
  filterForm!: FormGroup;
  continuationForm!: FormGroup;
  editForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private continuationService: ContinuationService,
    private studentService: StudentService,
    private alertService: AlertService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadStudents();
    this.loadContinuations();
    this.setupFilterSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.filterForm = this.fb.group({
      student_name: [''],
      date_from: [''],
      date_to: ['']
    });

    this.continuationForm = this.fb.group({
      student_uuid: ['', Validators.required],
      continuation_temporality: [''],
      continuation_commentary: ['', Validators.maxLength(50)]
    });

    // 🔧 Formulaire d'édition séparé - SANS student_uuid (non modifiable)
    this.editForm = this.fb.group({
      continuation_temporality: [''],
      continuation_commentary: ['', Validators.maxLength(50)]
    });
  }

  private setupFilterSubscription(): void {
    this.filterForm.valueChanges
      .pipe(
        startWith(this.filterForm.value),
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  private loadStudents(): void {
    this.studentService.getStudents().subscribe({
      next: (response: StudentListResponse | Student[]) => {
        // S'assurer que students est toujours un tableau
        if (Array.isArray(response)) {
          this.students = response;
        } else if (response && Array.isArray(response.students)) {
          this.students = response.students;
        } else if (response && 'data' in response && Array.isArray((response as Record<string, unknown>)['data'])) {
          this.students = (response as Record<string, unknown>)['data'] as Student[];
        } else {
          this.students = [];
        }
      },
      error: () => {
        // console.error('Erreur lors du chargement des étudiants:', error);
        this.students = []; // Toujours un tableau même en cas d'erreur
      }
    });
  }

  private loadContinuations(): void {
    this.isLoading = true;
    this.error = null;
    
    // Réinitialiser les tableaux
    this.continuations = [];
    this.filteredContinuations = [];

    

    this.continuationService.getAllContinuations().subscribe({
      next: (response) => {
        const responseUnknown = response as unknown as Record<string, unknown>;
        
        
        // S'assurer que nous avons un tableau
        let rawData: Continuation[] = [];
        if (Array.isArray(responseUnknown)) {
          rawData = responseUnknown;
        } else if (responseUnknown && responseUnknown['data'] && Array.isArray((responseUnknown['data'] as Record<string, unknown>)['data'])) {
          // Structure: { data: { data: [...], meta: {...} } }
          rawData = (responseUnknown['data'] as Record<string, unknown>)['data'] as Continuation[];
        } else if (responseUnknown && Array.isArray(responseUnknown['data'])) {
          // Structure: { data: [...] }
          rawData = responseUnknown['data'] as Continuation[];
        } else if (responseUnknown && Array.isArray(responseUnknown['continuations'])) {
          rawData = responseUnknown['continuations'] as Continuation[];
        } else {
          this.continuations = [];
          this.applyFilters();
          this.loadStats();
          this.isLoading = false;
          return;
        }

        // 🔧 FIX: Nettoyer le tableau mixte - éliminer les réponses d'API wrappées
        this.continuations = rawData.filter((item) => {
          // Garder seulement les objets qui ont directement un continuation_uuid
          // Éliminer les réponses d'API wrappées qui ont data: {continuation...}
          return item && item.continuation_uuid && !(item as unknown as Record<string, unknown>)['data'];
        });

        
        
        this.applyFilters();
        
        this.loadStats();
        this.isLoading = false;
      },
      error: () => {
        // console.error('❌ Erreur lors du chargement des continuations:', error);
        // console.error('❌ Status:', error.status);
        // console.error('❌ Message:', error.message);
        // console.error('❌ Response body:', error.error);
        
        this.error = 'Erreur lors du chargement des continuations';
        this.continuations = []; // TOUJOURS un tableau en cas d'erreur
        this.filteredContinuations = [];
        this.isLoading = false;
      }
    });
  }

  private loadStats(): void {
    this.isLoadingStats = true;
    
    this.continuationService.getContinuationStats().subscribe({
      next: (stats) => {
        this.continuationStats = stats;
        this.isLoadingStats = false;
      },
      error: () => {
        // console.error('Erreur lors du chargement des statistiques:', error);
        this.continuationStats = null;
        this.isLoadingStats = false;
      }
    });
  }

  private applyFilters(): void {
    if (!Array.isArray(this.continuations)) {
      this.continuations = [];
      this.filteredContinuations = [];
      return;
    }

    const filters = this.filterForm.value;
    this.filteredContinuations = this.continuations.filter(continuation => {
      let matches = true;

      // Filtre par nom d'étudiant
      if (filters.student_name) {
        const fullName = `${continuation.student?.student_firstname || ''} ${continuation.student?.student_lastname || ''}`.toLowerCase();
        matches = matches && fullName.includes(filters.student_name.toLowerCase());
      }

      // Pour les filtres de date, on ne peut plus les appliquer directement
      // puisque continuation_temporality est maintenant un string comme "3 mois"
      // On pourrait implémenter une logique différente si nécessaire

      return matches;
    });
  }

  // View mode management
  setViewMode(mode: 'cards' | 'list'): void {
    this.viewMode = mode;
  }

  // Form management
  showCreateContinuationForm(): void {
    this.showCreateForm = true;
    this.continuationForm.reset();
  }

  hideCreateForm(): void {
    this.showCreateForm = false;
    this.continuationForm.reset();
  }

  showEditContinuationForm(continuation: Continuation): void {
    this.selectedContinuation = continuation;
    // 🔧 Utiliser editForm qui ne contient QUE les champs modifiables
    this.editForm.patchValue({
      continuation_temporality: continuation.continuation_temporality || '',
      continuation_commentary: continuation.continuation_commentary || ''
    });
    this.showEditForm = true;
  }

  hideEditForm(): void {
    this.showEditForm = false;
    this.selectedContinuation = null;
    this.editForm.reset();
  }

  // CRUD operations
  onCreateContinuation(): void {
    if (this.continuationForm.valid) {
      this.isCreating = true;
      const formData: CreateContinuationDto = {
        studentId: this.continuationForm.value.student_uuid,
        temporality: this.continuationForm.value.continuation_temporality || null,
        commentary: this.continuationForm.value.continuation_commentary || null
      };

      this.continuationService.createContinuation(formData).subscribe({
        next: () => {
          // ✅ FIX: Recharger la liste complète au lieu de manipuler le tableau
          this.loadContinuations();
          this.hideCreateForm();
          this.alertService.success('Continuation créée avec succès');
          this.isCreating = false;
        },
        error: () => {
          this.alertService.error('Erreur lors de la création de la continuation');
          this.isCreating = false;
          // console.error('Erreur:', error);
        }
      });
    }
  }

  onUpdateContinuation(): void {
    if (this.editForm.valid && this.selectedContinuation) {
      this.isEditing = true;
      const updateData: UpdateContinuationDto = {
        temporality: this.editForm.value.continuation_temporality || null,
        commentary: this.editForm.value.continuation_commentary || null
      };

      this.continuationService.updateContinuation(this.selectedContinuation.continuation_uuid, 
updateData).subscribe({
        next: () => {
          // ✅ FIX: Recharger la liste complète au lieu de manipuler le tableau
          this.loadContinuations();
          this.hideEditForm();
          this.alertService.success('Continuation mise à jour avec succès');
          this.isEditing = false;
        },
        error: () => {
          this.alertService.error('Erreur lors de la mise à jour');
          this.isEditing = false;
          // console.error('Erreur:', error);
        }
      });
    }
  }

  deleteContinuation(continuation: Continuation): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette continuation ?')) {
      this.continuationService.deleteContinuation(continuation.continuation_uuid).subscribe({
        next: () => {
          // ✅ FIX: Recharger la liste complète au lieu de manipuler le tableau
          this.loadContinuations();
          this.alertService.success('Continuation supprimée');
        },
        error: () => {
          this.alertService.error('Erreur lors de la suppression');
          // console.error('Erreur:', error);
        }
      });
    }
  }

  // Utility methods
  onRefresh(): void {
    this.loadContinuations();
  }

  getStudentName(studentUuid: string): string {
    const student = this.students.find(s => s.student_uuid === studentUuid);
    return student ? `${student.student_firstname} ${student.student_lastname}` : 'Étudiant inconnu';
  }

  // TrackBy functions for performance
  trackByContinuationId(index: number, continuation: Continuation): string {
    return continuation.continuation_uuid;
  }
} 