import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReferenceDataService } from '@core/services';
import { ExitReason, CreateExitReasonDto } from '@core/models';

@Component({
  selector: 'app-exit-reasons',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './exit-reasons.component.html',
  styleUrls: ['./exit-reasons.component.scss'],
})
export class ExitReasonsComponent implements OnInit {
  exitReasons: ExitReason[] = [];
  isLoading = false;
  error: string | null = null;

  // Modals
  isCreateModalOpen = false;
  isEditModalOpen = false;
  selectedReason: ExitReason | null = null;

  // Forms
  createForm: FormGroup;
  editForm: FormGroup;

  constructor(
    private referenceDataService: ReferenceDataService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.createForm = this.formBuilder.group({
      reason: ['', [Validators.required, Validators.minLength(2)]],
    });

    this.editForm = this.formBuilder.group({
      reason: ['', [Validators.required, Validators.minLength(2)]],
    });
  }

  ngOnInit(): void {
    this.loadExitReasons();
  }

  loadExitReasons(): void {
    this.isLoading = true;
    this.error = null;

    this.referenceDataService.getExitReasons().subscribe({
      next: (reasons: ExitReason[]) => {
        this.exitReasons = reasons;
        this.isLoading = false;
      },
      error: error => {
        console.error('Erreur lors du chargement des raisons de sortie:', error);
        this.error = 'Erreur lors du chargement des raisons de sortie';
        this.isLoading = false;
      },
    });
  }

  // Getters pour les contrôles de formulaire
  get createReason() {
    return this.createForm.get('reason');
  }
  get editReason() {
    return this.editForm.get('reason');
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

  openEditModal(reason: ExitReason): void {
    this.selectedReason = reason;
    this.editForm.patchValue({
      reason: reason.reason,
    });
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editForm.reset();
    this.selectedReason = null;
  }

  // CRUD Operations
  createExitReason(): void {
    if (this.createForm.invalid) return;

    const reasonData: CreateExitReasonDto = {
      reason: this.createForm.value.reason,
    };

    this.referenceDataService.createExitReason(reasonData).subscribe({
      next: (newReason: ExitReason) => {
        this.exitReasons.push(newReason);
        this.closeCreateModal();
      },
      error: error => {
        console.error('Erreur lors de la création de la raison de sortie:', error);
        this.error = 'Erreur lors de la création de la raison de sortie';
      },
    });
  }

  updateExitReason(): void {
    if (this.editForm.invalid || !this.selectedReason) return;

    const reasonData: CreateExitReasonDto = {
      reason: this.editForm.value.reason,
    };

    this.referenceDataService.updateExitReason(this.selectedReason.id, reasonData).subscribe({
      next: (updatedReason: ExitReason) => {
        const index = this.exitReasons.findIndex(r => r.id === updatedReason.id);
        if (index !== -1) {
          this.exitReasons[index] = updatedReason;
        }
        this.closeEditModal();
      },
      error: error => {
        console.error('Erreur lors de la mise à jour de la raison de sortie:', error);
        this.error = 'Erreur lors de la mise à jour de la raison de sortie';
      },
    });
  }

  deleteExitReason(reason: ExitReason): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la raison "${reason.reason}" ?`)) {
      this.referenceDataService.deleteExitReason(reason.id).subscribe({
        next: () => {
          this.exitReasons = this.exitReasons.filter(r => r.id !== reason.id);
        },
        error: error => {
          console.error('Erreur lors de la suppression de la raison de sortie:', error);
          this.error = 'Erreur lors de la suppression de la raison de sortie';
        },
      });
    }
  }

  // Utility
  trackByReasonId(index: number, reason: ExitReason): string {
    return reason.id;
  }
}
