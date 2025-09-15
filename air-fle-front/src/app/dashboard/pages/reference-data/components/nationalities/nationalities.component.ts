import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ReferenceDataService } from '@core/services';
import { Nationality, CreateNationalityDto } from '@core/models';

@Component({
  selector: 'app-nationalities',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './nationalities.component.html',
  styleUrls: ['./nationalities.component.scss'],
})
export class NationalitiesComponent implements OnInit {
  nationalities: Nationality[] = [];
  isLoading = false;
  error: string | null = null;

  // Modal states
  isCreateModalOpen = false;
  isEditModalOpen = false;
  editingNationality: Nationality | null = null;

  // Form
  createForm: FormGroup;
  editForm: FormGroup;

  constructor(
    private referenceDataService: ReferenceDataService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.createForm = this.fb.group({
      label: ['', [Validators.required, Validators.minLength(2)]],
    });

    this.editForm = this.fb.group({
      label: ['', [Validators.required, Validators.minLength(2)]],
    });
  }

  ngOnInit(): void {
    this.loadNationalities();
  }

  // Charger les nationalités
  loadNationalities(): void {
    this.isLoading = true;
    this.error = null;

    this.referenceDataService.getNationalities().subscribe({
      next: (data) => {
        this.nationalities = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des nationalités';
        this.isLoading = false;
      }
    });
  }

  // Ouvrir modal de création
  openCreateModal(): void {
    this.createForm.reset();
    this.isCreateModalOpen = true;
  }

  // Fermer modal de création
  closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.createForm.reset();
  }

  // Créer une nationalité
  createNationality(): void {
    if (this.createForm.valid) {
      const formData: CreateNationalityDto = this.createForm.value;

      this.referenceDataService.createNationality(formData).subscribe({
        next: () => {
          this.loadNationalities(); // Recharger la liste
          this.closeCreateModal();
        },
        error: () => {
          console.error('Erreur lors de la création');
          this.error = 'Erreur lors de la création de la nationalité';
        },
      });
    }
  }

  // Ouvrir modal d'édition
  openEditModal(nationality: Nationality): void {
    this.editingNationality = nationality;
    this.editForm.patchValue({
      label: nationality.label,
    });
    this.isEditModalOpen = true;
  }

  // Fermer modal d'édition
  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editingNationality = null;
    this.editForm.reset();
  }

  // Modifier une nationalité
  updateNationality(): void {
    if (this.editForm.valid && this.editingNationality) {
      const formData: CreateNationalityDto = this.editForm.value;

      this.referenceDataService.updateNationality(this.editingNationality.id, formData).subscribe({
        next: () => {
          this.loadNationalities(); // Recharger la liste
          this.closeEditModal();
        },
        error: () => {
          console.error('Erreur lors de la modification');
          this.error = 'Erreur lors de la modification de la nationalité';
        },
      });
    }
  }

  // Supprimer une nationalité
  deleteNationality(nationality: Nationality): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la nationalité "${nationality.label}" ?`)) {
      this.referenceDataService.deleteNationality(nationality.id).subscribe({
        next: () => {
          this.loadNationalities(); // Recharger la liste
        },
        error: () => {
          console.error('Erreur lors de la suppression');
          this.error = 'Erreur lors de la suppression de la nationalité';
        },
      });
    }
  }

  // Retour à la liste principale
  goBack(): void {
    this.router.navigate(['/dashboard/reference-data']);
  }

  // Getters pour les formulaires
  get createLabel() {
    return this.createForm.get('label');
  }
  get editLabel() {
    return this.editForm.get('label');
  }

  // TrackBy function pour optimiser les performances
  trackByNationalityId(index: number, nationality: Nationality): string {
    return nationality.id;
  }
}
