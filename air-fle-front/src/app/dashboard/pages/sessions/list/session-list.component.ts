import { AlertService, SessionService } from '@core/services';

import { Session } from '@core/models';

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';


@Component({
  selector: 'app-session-list',
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
})
export class SessionListComponent implements OnInit {
  sessions: Session[] = [];
  loading = true;
  sessionForm: FormGroup;
  submitted = false;
  error = '';
  modal: { show: () => void; hide: () => void } | null = null;

  constructor(
    private sessionService: SessionService,
    private formBuilder: FormBuilder,
    private alertService: AlertService
  ) {
    this.sessionForm = this.formBuilder.group({
      label: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      started_at: ['', Validators.required],
      finished_at: ['', Validators.required],
    });
  }

  // Getter pour accéder aux contrôles du formulaire plus facilement
  get f(): { [key: string]: AbstractControl } {
    return this.sessionForm.controls;
  }

  ngOnInit(): void {
    this.loadSessions();
    // Modale Bootstrap supprimée (design inline)
  }

  // Vérifie si un champ est invalide
  isFieldInvalid(fieldName: string): boolean {
    const control = this.sessionForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched || this.submitted));
  }

  // Réinitialise le formulaire
  resetForm(): void {
    this.sessionForm.reset();
    this.submitted = false;
    this.error = '';
  }

  // Formate une date pour l'affichage
  formatDate(date: string | Date | null | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  // Soumission du formulaire
  onSubmit(): void {
    this.submitted = true;

    // Stop si le formulaire est invalide
    if (this.sessionForm.invalid) {
      return;
    }

    this.loading = true;

    // Récupérer les valeurs du formulaire
    const formValues = this.sessionForm.value;

    // ✅ Préparer les données avec les nouveaux noms de champs
    const formData = {
      session_label: formValues.label,
      session_started_at: formValues.started_at,
      session_finished_at: formValues.finished_at,
    };

    // Afficher les données dans la console pour debug
    

    this.sessionService.createSession(formData).subscribe({
      next: () => {

        if (this.modal) this.modal.hide();
        this.resetForm();
        this.loadSessions();
        this.loading = false;
      },
      error: (error: Error & { error?: { message?: string }; message?: string }) => {
        // console.error('Erreur complète:', error);
        this.error = error?.error?.message || error?.message || 'Une erreur est survenue';
        this.loading = false;
      },
    });
  }

  loadSessions(): void {
    this.loading = true;
    this.sessionService.getSessions().subscribe({
      next: sessions => {
        this.sessions = sessions;
        this.loading = false;
      },
      error: (err: Error) => {
        // console.error('Erreur lors du chargement des sessions', err);
        this.loading = false;
      },
    });
  }

  openCreateModal(): void {
    this.resetForm();

    // Initialiser avec la date du jour formatée
    const today = new Date();
    const todayIso = this.formatDateForInput(today);

    // Initialiser avec les dates du jour et dans 3 mois
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3);
    const futureDateIso = this.formatDateForInput(futureDate);

    this.sessionForm.patchValue({
      started_at: todayIso,
      finished_at: futureDateIso,
    });

    if (this.modal) this.modal.show();
  }

  dateFormatter(value: string | Date | null | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString('fr-FR');
  }

  // Méthode pour formater la date au format français pour l'affichage
  formatDateForDisplay(date: string | Date): string {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('fr-FR');
  }

  // Méthode pour obtenir la valeur ISO d'une date pour l'input date
  formatDateForInput(date: string | Date): string {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toISOString().split('T')[0]; // Format YYYY-MM-DD
  }

  // Méthode pour afficher la date au format français dans le champ texte
  getFormattedDate(dateValue: string): string {
    if (!dateValue) return '';
    return this.formatDateForDisplay(dateValue);
  }

  // Méthode pour convertir une date française (JJ/MM/AAAA) en format ISO (YYYY-MM-DD)
  parseAndConvertFrenchDate(frenchDate: string): string {
    if (!frenchDate) return '';

    // Vérifier si la date est au format JJ/MM/AAAA
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = frenchDate.match(dateRegex);

    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // Les mois en JS sont 0-11
      const year = parseInt(match[3], 10);

      const date = new Date(year, month, day);

      // Vérifier si la date est valide
      if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        return this.formatDateForInput(date);
      }
    }

    return '';
  }

  // Méthode appelée quand l'utilisateur quitte le champ de date
  onDateInputBlur(event: Event, fieldName: string): void {
    const target = event.target as HTMLInputElement;
    const frenchDate = target.value;
    if (frenchDate) {
      const isoDate = this.parseAndConvertFrenchDate(frenchDate);
      if (isoDate) {
        // Mettre à jour le champ caché avec la valeur ISO
        this.sessionForm.get(fieldName)?.setValue(isoDate);
      } else {
        // Si la date n'est pas valide, afficher un message d'erreur
        alert('Format de date invalide. Veuillez utiliser le format JJ/MM/AAAA');
        // Remettre la valeur précédente
        target.value = this.getFormattedDate(this.sessionForm.get(fieldName)?.value);
      }
    }
  }

  // Méthode pour ouvrir un sélecteur de date natif (pour mobile principalement)
  openDatePicker(fieldName: string): void {
    // Créer temporairement un élément input de type date
    const datePicker = document.createElement('input');
    datePicker.type = 'date';
    datePicker.style.position = 'absolute';
    datePicker.style.left = '-9999px';
    document.body.appendChild(datePicker);

    // Définir la valeur actuelle
    const currentValue = this.sessionForm.get(fieldName)?.value;
    if (currentValue) {
      datePicker.value = currentValue;
    }

    // Gestionnaire d'événement pour la sélection de date
    datePicker.addEventListener('change', () => {
      const selectedDate = datePicker.value;
      if (selectedDate) {
        // Mettre à jour le champ caché avec la valeur ISO
        this.sessionForm.get(fieldName)?.setValue(selectedDate);

        // Mettre à jour le champ d'affichage avec la valeur formatée
        const displayField = document.getElementById(`${fieldName}_fr`) as HTMLInputElement;
        if (displayField) {
          displayField.value = this.formatDateForDisplay(selectedDate);
        }
      }

      // Supprimer l'élément temporaire
      document.body.removeChild(datePicker);
    });

    // Déclencher le clic sur le sélecteur de date
    datePicker.click();
  }

  deleteSession(id: string | number): void {
    this.alertService
      .confirm(
        'Êtes-vous sûr de vouloir supprimer cette session ?\n\n' +
          'Cette action est irréversible et supprimera également tous les groupes et étudiants associés.',
        'Supprimer la session'
      )
      .then(confirmed => {
        if (confirmed) {
          this.sessionService.deleteSession(id).subscribe({
            next: () => {
              this.sessions = this.sessions.filter(s => s.session_uuid !== id);
              this.alertService.success('Session supprimée avec succès !');
            },
            error: err => {
              // console.error('Erreur lors de la suppression de la session', err);
              this.alertService.error('Erreur lors de la suppression. Veuillez réessayer.');
            },
          });
        }
      });
  }
}
