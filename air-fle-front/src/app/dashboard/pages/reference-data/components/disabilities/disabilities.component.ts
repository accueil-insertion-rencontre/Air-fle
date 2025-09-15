import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReferenceDataService } from '@core/services';
import { Disability, CreateDisabilityDto } from '@core/models';

@Component({
  selector: 'app-disabilities',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './disabilities.component.html',
  styleUrls: ['./disabilities.component.scss'],
})
export class DisabilitiesComponent implements OnInit {
  disabilities: Disability[] = [];
  isLoading = false;
  error: string | null = null;
  isCreateModalOpen = false;
  isEditModalOpen = false;
  selectedDisability: Disability | null = null;
  createForm: FormGroup;
  editForm: FormGroup;

  constructor(
    private referenceDataService: ReferenceDataService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.createForm = this.formBuilder.group({
      label: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
    });
    this.editForm = this.formBuilder.group({
      label: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.loadDisabilities();
  }

  loadDisabilities(): void {
    this.isLoading = true;
    this.error = null;
    this.referenceDataService.getDisabilities().subscribe({
      next: (disabilities: Disability[]) => {
        this.disabilities = disabilities;
        this.isLoading = false;
      },
      error: error => {
        console.error('Erreur lors du chargement des handicaps:', error);
        this.error = 'Erreur lors du chargement des handicaps';
        this.isLoading = false;
      },
    });
  }

  get createLabel() {
    return this.createForm.get('label');
  }
  get createDescription() {
    return this.createForm.get('description');
  }
  get editLabel() {
    return this.editForm.get('label');
  }
  get editDescription() {
    return this.editForm.get('description');
  }

  goBack(): void {
    this.router.navigate(['/dashboard/reference-data']);
  }

  openCreateModal(): void {
    this.createForm.reset();
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.createForm.reset();
  }

  openEditModal(disability: Disability): void {
    this.selectedDisability = disability;
    this.editForm.patchValue({
      label: disability.label,
      description: disability.description || '',
    });
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editForm.reset();
    this.selectedDisability = null;
  }

  createDisability(): void {
    if (this.createForm.invalid) return;
    const disabilityData: CreateDisabilityDto = {
      label: this.createForm.value.label,
      description: this.createForm.value.description || undefined,
    };
    this.referenceDataService.createDisability(disabilityData).subscribe({
      next: (newDisability: Disability) => {
        this.disabilities.push(newDisability);
        this.closeCreateModal();
      },
      error: error => {
        console.error('Erreur lors de la création du handicap:', error);
        this.error = 'Erreur lors de la création du handicap';
      },
    });
  }

  updateDisability(): void {
    if (this.editForm.invalid || !this.selectedDisability) return;
    const disabilityData: CreateDisabilityDto = {
      label: this.editForm.value.label,
      description: this.editForm.value.description || undefined,
    };
    this.referenceDataService
      .updateDisability(this.selectedDisability.id, disabilityData)
      .subscribe({
        next: (updatedDisability: Disability) => {
          const index = this.disabilities.findIndex(d => d.id === updatedDisability.id);
          if (index !== -1) {
            this.disabilities[index] = updatedDisability;
          }
          this.closeEditModal();
        },
        error: error => {
          console.error('Erreur lors de la mise à jour du handicap:', error);
          this.error = 'Erreur lors de la mise à jour du handicap';
        },
      });
  }

  deleteDisability(disability: Disability): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le handicap "${disability.label}" ?`)) {
      this.referenceDataService.deleteDisability(disability.id).subscribe({
        next: () => {
          this.disabilities = this.disabilities.filter(d => d.id !== disability.id);
        },
        error: error => {
          console.error('Erreur lors de la suppression du handicap:', error);
          this.error = 'Erreur lors de la suppression du handicap';
        },
      });
    }
  }

  trackByDisabilityId(index: number, disability: Disability): string {
    return disability.id;
  }
}
