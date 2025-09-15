import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReferenceDataService } from '@core/services';
import { Financing, CreateFinancingDto } from '@core/models';

@Component({
  selector: 'app-financings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './financings.component.html',
  styleUrls: ['./financings.component.scss'],
})
export class FinancingsComponent implements OnInit {
  financings: Financing[] = [];
  isLoading = false;
  error: string | null = null;
  isCreateModalOpen = false;
  isEditModalOpen = false;
  selectedFinancing: Financing | null = null;
  createForm: FormGroup;
  editForm: FormGroup;

  constructor(
    private referenceDataService: ReferenceDataService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.createForm = this.formBuilder.group({
      type: ['', [Validators.required, Validators.minLength(2)]],
    });
    this.editForm = this.formBuilder.group({
      type: ['', [Validators.required, Validators.minLength(2)]],
    });
  }

  ngOnInit(): void {
    this.loadFinancings();
  }

  loadFinancings(): void {
    this.isLoading = true;
    this.error = null;
    this.referenceDataService.getFinancings().subscribe({
      next: (financings: Financing[]) => {
        this.financings = financings;
        this.isLoading = false;
      },
      error: error => {
        console.error('Erreur lors du chargement des financements:', error);
        this.error = 'Erreur lors du chargement des financements';
        this.isLoading = false;
      },
    });
  }

  get createType() {
    return this.createForm.get('type');
  }
  get editType() {
    return this.editForm.get('type');
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

  openEditModal(financing: Financing): void {
    this.selectedFinancing = financing;
    this.editForm.patchValue({ type: financing.type });
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editForm.reset();
    this.selectedFinancing = null;
  }

  createFinancing(): void {
    if (this.createForm.invalid) return;
    const financingData: CreateFinancingDto = { type: this.createForm.value.type };
    this.referenceDataService.createFinancing(financingData).subscribe({
      next: (newFinancing: Financing) => {
        this.financings.push(newFinancing);
        this.closeCreateModal();
      },
      error: error => {
        console.error('Erreur lors de la création du financement:', error);
        this.error = 'Erreur lors de la création du financement';
      },
    });
  }

  updateFinancing(): void {
    if (this.editForm.invalid || !this.selectedFinancing) return;
    const financingData: CreateFinancingDto = { type: this.editForm.value.type };
    this.referenceDataService.updateFinancing(this.selectedFinancing.id, financingData).subscribe({
      next: (updatedFinancing: Financing) => {
        const index = this.financings.findIndex(f => f.id === updatedFinancing.id);
        if (index !== -1) {
          this.financings[index] = updatedFinancing;
        }
        this.closeEditModal();
      },
      error: error => {
        console.error('Erreur lors de la mise à jour du financement:', error);
        this.error = 'Erreur lors de la mise à jour du financement';
      },
    });
  }

  deleteFinancing(financing: Financing): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le financement "${financing.type}" ?`)) {
      this.referenceDataService.deleteFinancing(financing.id).subscribe({
        next: () => {
          this.financings = this.financings.filter(f => f.id !== financing.id);
        },
        error: error => {
          console.error('Erreur lors de la suppression du financement:', error);
          this.error = 'Erreur lors de la suppression du financement';
        },
      });
    }
  }

  trackByFinancingId(index: number, financing: Financing): string {
    return financing.id;
  }
}
