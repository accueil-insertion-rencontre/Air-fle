import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReferenceDataService } from '@core/services';
import { Orientation, CreateOrientationDto } from '@core/models';

@Component({
  selector: 'app-orientations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './orientations.component.html',
  styleUrls: ['./orientations.component.scss'],
})
export class OrientationsComponent implements OnInit {
  orientations: Orientation[] = [];
  isLoading = false;
  error: string | null = null;
  isCreateModalOpen = false;
  isEditModalOpen = false;
  selectedOrientation: Orientation | null = null;
  createForm: FormGroup;
  editForm: FormGroup;

  constructor(
    private referenceDataService: ReferenceDataService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.createForm = this.formBuilder.group({
      type: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
    });
    this.editForm = this.formBuilder.group({
      type: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.loadOrientations();
  }

  loadOrientations(): void {
    this.isLoading = true;
    this.error = null;
    this.referenceDataService.getOrientations().subscribe({
      next: (orientations: Orientation[]) => {
        this.orientations = orientations;
        this.isLoading = false;
      },
      error: error => {
        console.error('Erreur lors du chargement des orientations:', error);
        this.error = 'Erreur lors du chargement des orientations';
        this.isLoading = false;
      },
    });
  }

  get createType() {
    return this.createForm.get('type');
  }
  get createDescription() {
    return this.createForm.get('description');
  }
  get editType() {
    return this.editForm.get('type');
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

  openEditModal(orientation: Orientation): void {
    this.selectedOrientation = orientation;
    this.editForm.patchValue({
      type: orientation.type,
      description: orientation.description || '',
    });
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editForm.reset();
    this.selectedOrientation = null;
  }

  createOrientation(): void {
    if (this.createForm.invalid) return;
    const orientationData: CreateOrientationDto = {
      type: this.createForm.value.type,
      description: this.createForm.value.description || undefined,
    };
    this.referenceDataService.createOrientation(orientationData).subscribe({
      next: (newOrientation: Orientation) => {
        this.orientations.push(newOrientation);
        this.closeCreateModal();
      },
      error: error => {
        console.error("Erreur lors de la création de l'orientation:", error);
        this.error = "Erreur lors de la création de l'orientation";
      },
    });
  }

  updateOrientation(): void {
    if (this.editForm.invalid || !this.selectedOrientation) return;
    const orientationData: CreateOrientationDto = {
      type: this.editForm.value.type,
      description: this.editForm.value.description || undefined,
    };
    this.referenceDataService
      .updateOrientation(this.selectedOrientation.id, orientationData)
      .subscribe({
        next: (updatedOrientation: Orientation) => {
          const index = this.orientations.findIndex(o => o.id === updatedOrientation.id);
          if (index !== -1) {
            this.orientations[index] = updatedOrientation;
          }
          this.closeEditModal();
        },
        error: error => {
          console.error("Erreur lors de la mise à jour de l'orientation:", error);
          this.error = "Erreur lors de la mise à jour de l'orientation";
        },
      });
  }

  deleteOrientation(orientation: Orientation): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'orientation "${orientation.type}" ?`)) {
      this.referenceDataService.deleteOrientation(orientation.id).subscribe({
        next: () => {
          this.orientations = this.orientations.filter(o => o.id !== orientation.id);
        },
        error: error => {
          console.error("Erreur lors de la suppression de l'orientation:", error);
          this.error = "Erreur lors de la suppression de l'orientation";
        },
      });
    }
  }

  trackByOrientationId(index: number, orientation: Orientation): string {
    return orientation.id;
  }
}
