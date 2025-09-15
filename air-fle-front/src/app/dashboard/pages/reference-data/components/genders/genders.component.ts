import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReferenceDataService } from '@core/services';
import { Gender, CreateGenderDto } from '@core/models';

@Component({
  selector: 'app-genders',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './genders.component.html',
  styleUrls: ['./genders.component.scss'],
})
export class GendersComponent implements OnInit {
  genders: Gender[] = [];
  isLoading = false;
  error: string | null = null;

  // Modals
  isCreateModalOpen = false;
  isEditModalOpen = false;
  selectedGender: Gender | null = null;

  // Forms
  createForm: FormGroup;
  editForm: FormGroup;

  constructor(
    private referenceDataService: ReferenceDataService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.createForm = this.formBuilder.group({
      label: ['', [Validators.required, Validators.minLength(2)]],
    });

    this.editForm = this.formBuilder.group({
      label: ['', [Validators.required, Validators.minLength(2)]],
    });
  }

  ngOnInit(): void {
    this.loadGenders();
  }

  loadGenders(): void {
    this.isLoading = true;
    this.error = null;

    this.referenceDataService.getGenders().subscribe({
      next: (genders: Gender[]) => {
        this.genders = genders;
        this.isLoading = false;
      },
      error: error => {
        console.error('Erreur lors du chargement des genres:', error);
        this.error = 'Erreur lors du chargement des genres';
        this.isLoading = false;
      },
    });
  }

  // Getters pour les contrôles de formulaire
  get createLabel() {
    return this.createForm.get('label');
  }
  get editLabel() {
    return this.editForm.get('label');
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

  openEditModal(gender: Gender): void {
    this.selectedGender = gender;
    this.editForm.patchValue({
      label: gender.label,
    });
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editForm.reset();
    this.selectedGender = null;
  }

  // CRUD Operations
  createGender(): void {
    if (this.createForm.invalid) return;

    const genderData: CreateGenderDto = {
      label: this.createForm.value.label,
    };

    this.referenceDataService.createGender(genderData).subscribe({
      next: (newGender: Gender) => {
        this.genders.push(newGender);
        this.closeCreateModal();
      },
      error: error => {
        console.error('Erreur lors de la création du genre:', error);
        this.error = 'Erreur lors de la création du genre';
      },
    });
  }

  updateGender(): void {
    if (this.editForm.invalid || !this.selectedGender) return;

    const genderData: CreateGenderDto = {
      label: this.editForm.value.label,
    };

    this.referenceDataService.updateGender(this.selectedGender.id, genderData).subscribe({
      next: (updatedGender: Gender) => {
        const index = this.genders.findIndex(g => g.id === updatedGender.id);
        if (index !== -1) {
          this.genders[index] = updatedGender;
        }
        this.closeEditModal();
      },
      error: error => {
        console.error('Erreur lors de la mise à jour du genre:', error);
        this.error = 'Erreur lors de la mise à jour du genre';
      },
    });
  }

  deleteGender(gender: Gender): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le genre "${gender.label}" ?`)) {
      this.referenceDataService.deleteGender(gender.id).subscribe({
        next: () => {
          this.genders = this.genders.filter(g => g.id !== gender.id);
        },
        error: error => {
          console.error('Erreur lors de la suppression du genre:', error);
          this.error = 'Erreur lors de la suppression du genre';
        },
      });
    }
  }

  // Utility
  trackByGenderId(index: number, gender: Gender): string {
    return gender.id;
  }
}
