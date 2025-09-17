import { SessionService } from '@core/services';

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-session-create',
  templateUrl: './session-create.component.html',
  styleUrls: ['./session-create.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
})
export class SessionCreateComponent implements OnInit {
  sessionForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  isEditMode = false;
  sessionId?: string | number;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private sessionService: SessionService
  ) {
    this.sessionForm = this.formBuilder.group({
      label: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      started_at: ['', Validators.required],
      finished_at: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // Vérifier si nous sommes en mode édition
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.sessionId = params['id'];

        this.loadSessionDetails();
      }
    });
  }

  loadSessionDetails(): void {
    if (!this.sessionId) return;

    this.loading = true;
    

    this.sessionService.getSessionById(this.sessionId as number).subscribe({
      next: session => {
        

        // Pré-remplir le formulaire avec les données de la session
        this.sessionForm.patchValue({
          label: session.session_label || session.label || '',
          started_at: this.formatDateForInput(session.session_started_at || session.started_at),
          finished_at: this.formatDateForInput(session.session_finished_at || session.finished_at),
        });

        this.loading = false;
      },
      error: error => {
        // console.error('Erreur lors du chargement de la session:', error);
        this.error = 'Impossible de charger les détails de la session';
        this.loading = false;
      },
    });
  }

  // Formate une date pour les champs input de type date (YYYY-MM-DD)
  formatDateForInput(dateValue: string | Date | undefined): string {
    if (!dateValue) return '';

    let date: Date;
    if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else {
      date = dateValue;
    }

    if (isNaN(date.getTime())) return '';

    // Format YYYY-MM-DD requis pour les input de type date
    return date.toISOString().split('T')[0];
  }

  get f() {
    return this.sessionForm.controls;
  }

  onSubmit() {
    this.submitted = true;

    // Stop si formulaire invalide
    if (this.sessionForm.invalid) {
      return;
    }

    this.loading = true;

    // ✅ Transformer les données pour utiliser les nouveaux noms de champs
    const formValues = this.sessionForm.value;
    const formData = {
      session_label: formValues.label,
      session_started_at: formValues.started_at,
      session_finished_at: formValues.finished_at,
    };

    if (this.isEditMode && this.sessionId) {
      // Mode édition
      
      this.sessionService.updateSession(this.sessionId, formData).subscribe({
        next: () => {
          
          this.router.navigate(['/dashboard/sessions']);
        },
        error: error => {
          // console.error('Erreur lors de la mise à jour:', error);
          this.error =
            error?.error?.message ||
            error?.message ||
            'Erreur lors de la mise à jour de la session';
          this.loading = false;
        },
      });
    } else {
      // Mode création
      
      this.sessionService.createSession(formData).subscribe({
        next: () => {
          
          this.router.navigate(['/dashboard/sessions']);
        },
        error: error => {
          // console.error('Erreur lors de la création:', error);
          this.error =
            error?.error?.message || error?.message || 'Erreur lors de la création de la session';
          this.loading = false;
        },
      });
    }
  }

  // Vérifie si le champ a été touché et est invalide
  isFieldInvalid(fieldName: string): boolean {
    const control = this.sessionForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched || this.submitted));
  }

  // Réinitialise le formulaire
  resetForm() {
    this.sessionForm.reset();
    this.submitted = false;
  }
}
