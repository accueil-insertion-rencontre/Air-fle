import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { map, startWith, catchError, shareReplay, switchMap, finalize } from 'rxjs/operators';

// 🔥 Imports avec barrel exports
import { ReferenceDataService } from '@core/services';
import { FrenchLevel, CreateFrenchLevelDto } from '@core/models';

interface FrenchLevelsState {
  levels: FrenchLevel[];
  isLoading: boolean;
  error: string | null;
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  selectedLevel: FrenchLevel | null;
}

@Component({
  selector: 'app-french-levels-optimized',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './french-levels.component.html',
  styleUrls: ['./french-levels.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush, // 🔥 OnPush Strategy
})
export class FrenchLevelsOptimizedComponent {
  // 🔥 Injection moderne avec inject()
  private readonly referenceDataService = inject(ReferenceDataService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  // 🔥 State Management réactif avec BehaviorSubjects
  private readonly levelsSubject = new BehaviorSubject<FrenchLevel[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  private readonly createModalSubject = new BehaviorSubject<boolean>(false);
  private readonly editModalSubject = new BehaviorSubject<boolean>(false);
  private readonly selectedLevelSubject = new BehaviorSubject<FrenchLevel | null>(null);

  // 🔥 Observables publics pour le template avec async pipe
  readonly levels$ = this.levelsSubject.asObservable();
  readonly isLoading$ = this.loadingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();
  readonly isCreateModalOpen$ = this.createModalSubject.asObservable();
  readonly isEditModalOpen$ = this.editModalSubject.asObservable();
  readonly selectedLevel$ = this.selectedLevelSubject.asObservable();

  // 🔥 State combiné pour le template
  readonly state$: Observable<FrenchLevelsState> = combineLatest([
    this.levels$,
    this.isLoading$,
    this.error$,
    this.isCreateModalOpen$,
    this.isEditModalOpen$,
    this.selectedLevel$,
  ]).pipe(
    map(([levels, isLoading, error, isCreateModalOpen, isEditModalOpen, selectedLevel]) => ({
      levels,
      isLoading,
      error,
      isCreateModalOpen,
      isEditModalOpen,
      selectedLevel,
    })),
    shareReplay(1) // 🔥 Cache pour éviter les re-exécutions
  );

  // 🔥 Forms réactifs
  readonly createForm: FormGroup = this.formBuilder.group({
    code: ['', [Validators.required, Validators.minLength(2)]],
    description: ['', [Validators.required, Validators.minLength(3)]],
  });

  readonly editForm: FormGroup = this.formBuilder.group({
    code: ['', [Validators.required, Validators.minLength(2)]],
    description: ['', [Validators.required, Validators.minLength(3)]],
  });

  // 🔥 Getters réactifs pour la validation
  readonly createCode$ = this.createForm.get('code')!.valueChanges.pipe(startWith(''));
  readonly createDescription$ = this.createForm
    .get('description')!
    .valueChanges.pipe(startWith(''));

  constructor() {
    // 🔥 Chargement initial automatique
    this.loadFrenchLevels();
  }

  // 🔥 Méthodes publiques pour le template
  loadFrenchLevels(): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.referenceDataService
      .getFrenchLevels()
      .pipe(
        takeUntilDestroyed(), // 🔥 Auto-unsubscribe moderne
        catchError(error => {
          this.errorSubject.next('Erreur lors du chargement des niveaux');
          console.error('Error loading french levels:', error);
          return of([]); // 🔥 Fallback pour éviter les erreurs dans le template
        }),
        finalize(() => this.loadingSubject.next(false))
      )
      .subscribe({
        next: levels => this.levelsSubject.next(levels),
      });
  }

  openCreateModal(): void {
    this.createForm.reset();
    this.createModalSubject.next(true);
  }

  closeCreateModal(): void {
    this.createModalSubject.next(false);
    this.createForm.reset();
  }

  openEditModal(level: FrenchLevel): void {
    this.selectedLevelSubject.next(level);
    this.editForm.patchValue({
      code: level.code,
      description: level.description,
    });
    this.editModalSubject.next(true);
  }

  closeEditModal(): void {
    this.editModalSubject.next(false);
    this.selectedLevelSubject.next(null);
    this.editForm.reset();
  }

  createFrenchLevel(): void {
    if (this.createForm.valid) {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      const formValue: CreateFrenchLevelDto = this.createForm.value;

      this.referenceDataService
        .createFrenchLevel(formValue)
        .pipe(
          takeUntilDestroyed(),
          switchMap(() => this.referenceDataService.getFrenchLevels()), // 🔥 Rechargement automatique
          catchError(error => {
            this.errorSubject.next('Erreur lors de la création');
            console.error('Error creating french level:', error);
            return of(this.levelsSubject.value); // 🔥 Garder l'état précédent
          }),
          finalize(() => this.loadingSubject.next(false))
        )
        .subscribe({
          next: levels => {
            this.levelsSubject.next(levels);
            this.closeCreateModal();
          },
        });
    }
  }

  updateFrenchLevel(): void {
    const selectedLevel = this.selectedLevelSubject.value;
    if (this.editForm.valid && selectedLevel) {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      const formValue: CreateFrenchLevelDto = this.editForm.value;

      this.referenceDataService
        .updateFrenchLevel(selectedLevel.id, formValue)
        .pipe(
          takeUntilDestroyed(),
          switchMap(() => this.referenceDataService.getFrenchLevels()),
          catchError(error => {
            this.errorSubject.next('Erreur lors de la mise à jour');
            console.error('Error updating french level:', error);
            return of(this.levelsSubject.value);
          }),
          finalize(() => this.loadingSubject.next(false))
        )
        .subscribe({
          next: levels => {
            this.levelsSubject.next(levels);
            this.closeEditModal();
          },
        });
    }
  }

  deleteFrenchLevel(level: FrenchLevel): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le niveau "${level.code}" ?`)) {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      this.referenceDataService
        .deleteFrenchLevel(level.id)
        .pipe(
          takeUntilDestroyed(),
          switchMap(() => this.referenceDataService.getFrenchLevels()),
          catchError(error => {
            this.errorSubject.next('Erreur lors de la suppression');
            console.error('Error deleting french level:', error);
            return of(this.levelsSubject.value);
          }),
          finalize(() => this.loadingSubject.next(false))
        )
        .subscribe({
          next: levels => this.levelsSubject.next(levels),
        });
    }
  }

  // 🔥 TrackBy function pour optimiser les performances de la liste
  trackByLevelId(index: number, level: FrenchLevel): string {
    return level.id;
  }

  // 🔥 Helpers pour la validation (utilisables avec async pipe)
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const control = form.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const control = form.get(fieldName);
    if (control?.errors) {
      if (control.errors['required']) return 'Ce champ est requis';
      if (control.errors['minlength'])
        return `Minimum ${control.errors['minlength'].requiredLength} caractères`;
    }
    return '';
  }
}
