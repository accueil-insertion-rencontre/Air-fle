import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReferenceDataService } from '@core/services';
import { Status, CreateStatusDto } from '@core/models';

@Component({
  selector: 'app-statuses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './statuses.component.html',
  styleUrls: ['./statuses.component.scss'],
})
export class StatusesComponent implements OnInit {
  statuses: Status[] = [];
  isLoading = false;
  error: string | null = null;
  isCreateModalOpen = false;
  isEditModalOpen = false;
  selectedStatus: Status | null = null;
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
    this.loadStatuses();
  }

  loadStatuses(): void {
    this.isLoading = true;
    this.error = null;
    this.referenceDataService.getStatuses().subscribe({
      next: (statuses: Status[]) => {
        this.statuses = statuses;
        this.isLoading = false;
      },
      error: error => {
        console.error('Erreur lors du chargement des statuts:', error);
        this.error = 'Erreur lors du chargement des statuts';
        this.isLoading = false;
      },
    });
  }

  get createLabel() {
    return this.createForm.get('label');
  }
  get editLabel() {
    return this.editForm.get('label');
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

  openEditModal(status: Status): void {
    this.selectedStatus = status;
    this.editForm.patchValue({ label: status.label });
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editForm.reset();
    this.selectedStatus = null;
  }

  createStatus(): void {
    if (this.createForm.invalid) return;
    const statusData: CreateStatusDto = { label: this.createForm.value.label };
    this.referenceDataService.createStatus(statusData).subscribe({
      next: (newStatus: Status) => {
        this.statuses.push(newStatus);
        this.closeCreateModal();
      },
      error: error => {
        console.error('Erreur lors de la création du statut:', error);
        this.error = 'Erreur lors de la création du statut';
      },
    });
  }

  updateStatus(): void {
    if (this.editForm.invalid || !this.selectedStatus) return;
    const statusData: CreateStatusDto = { label: this.editForm.value.label };
    this.referenceDataService.updateStatus(this.selectedStatus.id, statusData).subscribe({
      next: (updatedStatus: Status) => {
        const index = this.statuses.findIndex(s => s.id === updatedStatus.id);
        if (index !== -1) {
          this.statuses[index] = updatedStatus;
        }
        this.closeEditModal();
      },
      error: error => {
        console.error('Erreur lors de la mise à jour du statut:', error);
        this.error = 'Erreur lors de la mise à jour du statut';
      },
    });
  }

  deleteStatus(status: Status): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le statut "${status.label}" ?`)) {
      this.referenceDataService.deleteStatus(status.id).subscribe({
        next: () => {
          this.statuses = this.statuses.filter(s => s.id !== status.id);
        },
        error: error => {
          console.error('Erreur lors de la suppression du statut:', error);
          this.error = 'Erreur lors de la suppression du statut';
        },
      });
    }
  }

  trackByStatusId(index: number, status: Status): string {
    return status.id;
  }
}
