import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReferenceDataService } from '@core/services';
import { FrenchLevel, CreateFrenchLevelDto } from '@core/models';

@Component({
  selector: 'app-french-levels',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './french-levels.component.html',
  styleUrls: ['./french-levels.component.scss'],
})
export class FrenchLevelsComponent implements OnInit {
  frenchLevels: FrenchLevel[] = [];
  isLoading = false;
  error: string | null = null;

  // Modals
  isCreateModalOpen = false;
  isEditModalOpen = false;
  selectedLevel: FrenchLevel | null = null;

  // Forms
  createForm: FormGroup;
  editForm: FormGroup;

  constructor(
    private referenceDataService: ReferenceDataService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.createForm = this.formBuilder.group({
      code: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(3)]],
    });

    this.editForm = this.formBuilder.group({
      code: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  ngOnInit(): void {
    this.loadFrenchLevels();
  }

  loadFrenchLevels(): void {
    this.isLoading = true;
    this.error = null;

    this.referenceDataService.getFrenchLevels().subscribe({
      next: (levels: FrenchLevel[]) => {
        this.frenchLevels = levels;
        this.isLoading = false;
      },
      error: error => {
        this.error = 'Erreur lors du chargement des niveaux de français';
        this.isLoading = false;
      },
    });
  }

  // Getters pour les contrôles de formulaire
  get createCode() {
    return this.createForm.get('code');
  }
  get createDescription() {
    return this.createForm.get('description');
  }
  get editCode() {
    return this.editForm.get('code');
  }
  get editDescription() {
    return this.editForm.get('description');
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/dashboard/reference-data']);
  }

  // Modals
  openCreateModal(): void {
    this.createForm.reset();
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.createForm.reset();
  }

  openEditModal(level: FrenchLevel): void {
    this.selectedLevel = level;
    this.editForm.patchValue({
      code: level.code,
      description: level.description,
    });
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editForm.reset();
    this.selectedLevel = null;
  }

  // CRUD Operations
  createFrenchLevel(): void {
    if (this.createForm.invalid) return;

    const levelData: CreateFrenchLevelDto = {
      code: this.createForm.value.code,
      description: this.createForm.value.description,
    };

    this.referenceDataService.createFrenchLevel(levelData).subscribe({
      next: (newLevel: FrenchLevel) => {
        this.frenchLevels.push(newLevel);
        this.closeCreateModal();
      },
      error: error => {
        console.error('Erreur lors de la création du niveau:', error);
        this.error = 'Erreur lors de la création du niveau de français';
      },
    });
  }

  updateFrenchLevel(): void {
    if (this.editForm.invalid || !this.selectedLevel) return;

    const levelData: CreateFrenchLevelDto = {
      code: this.editForm.value.code,
      description: this.editForm.value.description,
    };

    this.referenceDataService.updateFrenchLevel(this.selectedLevel.id, levelData).subscribe({
      next: (updatedLevel: FrenchLevel) => {
        const index = this.frenchLevels.findIndex(l => l.id === updatedLevel.id);
        if (index !== -1) {
          this.frenchLevels[index] = updatedLevel;
        }
        this.closeEditModal();
      },
      error: error => {
        console.error('Erreur lors de la mise à jour du niveau:', error);
        this.error = 'Erreur lors de la mise à jour du niveau de français';
      },
    });
  }

  deleteFrenchLevel(level: FrenchLevel): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le niveau "${level.code}" ?`)) {
      this.referenceDataService.deleteFrenchLevel(level.id).subscribe({
        next: () => {
          this.frenchLevels = this.frenchLevels.filter(l => l.id !== level.id);
        },
        error: error => {
          console.error('Erreur lors de la suppression du niveau:', error);
          this.error = 'Erreur lors de la suppression du niveau de français';
        },
      });
    }
  }

  // Utility
  trackByLevelId(index: number, level: FrenchLevel): string {
    return level.id;
  }
}
