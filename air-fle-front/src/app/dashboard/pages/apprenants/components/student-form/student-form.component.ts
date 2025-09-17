import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentService, ReferenceDataService, SanitizationService, ValidationService } from '@core/services';
import { AutoSanitizeDirective } from '@shared/directives';
import { tap } from 'rxjs/operators';
import {
  CreateStudentRequest,
  Gender,
  Nationality,
  FrenchLevel,
  Financing,
  Status,
  Orientation,
  ExitReason,
  Disability,
} from '@core/models';

// Interface ReferenceData pour les données locales
export interface ReferenceData {
  genders: Gender[];
  nationalities: Nationality[];
  frenchLevels: FrenchLevel[];
  financings: Financing[];
  statuses: Status[];
  orientations: Orientation[];
  exitReasons: ExitReason[];
  disabilities: Disability[];
}

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AutoSanitizeDirective],
  templateUrl: './student-form.component.html',
  styleUrls: ['./student-form.component.scss'],
})
export class StudentFormComponent implements OnInit {
  studentForm: FormGroup;
  isSubmitting = false;
  isLoading = true;
  error: string | null = null;
  studentId: string | null = null;
  isEditMode = false;

  // Données de référence
  genders: Gender[] = [];
  nationalities: Nationality[] = [];
  frenchLevels: FrenchLevel[] = [];
  financings: Financing[] = [];
  statuses: Status[] = [];
  orientations: Orientation[] = [];
  exitReasons: ExitReason[] = [];
  disabilities: Disability[] = [];

  constructor(
    private fb: FormBuilder,
    private studentService: StudentService,
    private referenceDataService: ReferenceDataService,
    private sanitizationService: SanitizationService,
    private validationService: ValidationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.studentForm = this.createForm();
  }

  ngOnInit(): void {
    // Récupérer l'ID de l'apprenant depuis la route
    this.studentId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.studentId;
    
    // Charger d'abord les données de référence, puis les données de l'étudiant
    this.loadReferenceData().subscribe({
      next: () => {
        // Une fois les données de référence chargées, charger les données de l'étudiant si en mode édition
        if (this.isEditMode && this.studentId) {
          this.loadStudentData(this.studentId);
        } else {
          this.isLoading = false;
        }
      },
      error: () => {
        this.error = 'Erreur lors du chargement des données de référence';
        this.isLoading = false;
      }
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // INFORMATIONS PERSONNELLES OBLIGATOIRES
      firstname: ['', [
        Validators.required, 
        Validators.maxLength(100),
        this.validationService.validNameValidator(),
        this.validationService.noHtmlValidator()
      ]],
      lastname: ['', [
        Validators.required, 
        Validators.maxLength(100),
        this.validationService.validNameValidator(),
        this.validationService.noHtmlValidator()
      ]],
      birthdate: ['', [Validators.required]],

      // INFORMATIONS PERSONNELLES OPTIONNELLES
      placeOfBirth: ['', [this.validationService.noHtmlValidator()]],
      email: ['', [
        Validators.email,
        this.validationService.validSanitizedEmailValidator(),
        this.validationService.noHtmlValidator()
      ]],
      phone: ['', [
        Validators.pattern(/^\+?[0-9\s\-()]{8,}$/),
        this.validationService.validSanitizedPhoneValidator(),
        this.validationService.noHtmlValidator()
      ]],
      date_test_initial: [''],
      commentaire: ['', [this.validationService.noHtmlValidator()]],
      date_entree_france: [''],
      date_titre_sejour: [''],
      date_cir: [''],

      // IDS OBLIGATOIRES
      gender_id: ['', [Validators.required]],
      initial_level_id: ['', [Validators.required]], // Niveau déterminé par test de positionnement
      nationality_id: ['', [Validators.required]],
      financing_id: ['', [Validators.required]],
      status_id: ['', [Validators.required]],

      // IDS OPTIONNELS
      orientation_id: [''],
      exit_reason_id: [''],

      // HANDICAPS
      hasDisability: [false], // Switch pour activer/désactiver la sélection des handicaps
      selectedDisabilities: [[]], // Tableau des handicaps sélectionnés
    });
  }

  private loadReferenceData() {
    // Charger toutes les données de référence
    return this.referenceDataService.getAllReferenceData().pipe(
      tap({
        next: (data) => {
          this.genders = data.genders;
          this.nationalities = data.nationalities;
          this.frenchLevels = data.frenchLevels;
          this.financings = data.financings;
          this.statuses = data.statuses;
          this.orientations = data.orientations;
          this.exitReasons = data.exitReasons;
          this.disabilities = data.disabilities;
        }
      })
    );
  }

  private loadStudentData(studentId: string): void {
    this.studentService.getStudentById(studentId).subscribe({
      next: (student) => {
        // Mapper les handicaps - LA STRUCTURE EST: disabilities[0].disability_uuid directement !
        const mappedDisabilities = student.disabilities ? student.disabilities.map((d: { disability_uuid?: string }) => {
          // La structure retournée par l'API est { student_uuid, disability_uuid, disability: {...} }
          const uuid = d.disability_uuid || '';
          return uuid;
        }).filter(id => id !== '') : [];
        
        // Préremplir le formulaire avec les données de l'apprenant
        this.studentForm.patchValue({
          // INFORMATIONS PERSONNELLES
          firstname: student.student_firstname,
          lastname: student.student_lastname,
          birthdate: student.student_birthdate,
          placeOfBirth: student.student_place_of_birth,
          
          // CONTACT
          email: student.student_mail,
          phone: student.student_phone,
          
          // DATES
          date_test_initial: student.student_date_test_initial,
          date_entree_france: student.student_date_entry_france,
          date_titre_sejour: student.student_date_residence_permit,
          date_cir: student.student_date_cir,
          commentaire: student.student_commentary,
          
          // IDS OBLIGATOIRES
          gender_id: student.gender_uuid,
          initial_level_id: student.french_level_uuid,
          nationality_id: student.nationality_uuid,
          financing_id: student.financing_uuid,
          status_id: student.status_uuid,
          
          // IDS OPTIONNELS
          orientation_id: student.orientation_uuid,
          exit_reason_id: student.exit_reason_uuid,
          
          // HANDICAPS
          hasDisability: student.disabilities && student.disabilities.length > 0,
          selectedDisabilities: mappedDisabilities
        });
        
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Erreur lors du chargement des données de l\'apprenant';
        this.isLoading = false;
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.studentForm.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  getFieldError(field: string): string {
    const control = this.studentForm.get(field);
    if (control?.errors) {
      if (control.errors['required']) {
        return 'Ce champ est obligatoire';
      }
      if (control.errors['email']) {
        return "Format d'email invalide";
      }
      if (control.errors['pattern']) {
        return 'Format invalide';
      }
      if (control.errors['maxlength']) {
        return `Maximum ${control.errors['maxlength'].requiredLength} caractères`;
      }
      if (control.errors['containsHtml']) {
        return 'Ce champ ne peut pas contenir de code HTML';
      }
      if (control.errors['invalidNameCharacters']) {
        return 'Ce nom contient des caractères non autorisés';
      }
      if (control.errors['invalidSanitizedEmail']) {
        return 'Format d\'email invalide après nettoyage';
      }
      if (control.errors['invalidSanitizedPhone']) {
        return 'Format de téléphone invalide';
      }
    }
    return '';
  }

  onDisabilityToggle(disabilityId: string, isChecked: boolean): void {
    const selectedDisabilities = this.studentForm.get('selectedDisabilities')?.value || [];

    if (isChecked) {
      // Ajouter le handicap s'il n'est pas déjà présent
      if (!selectedDisabilities.includes(disabilityId)) {
        selectedDisabilities.push(disabilityId);
      }
    } else {
      // Retirer le handicap
      const index = selectedDisabilities.indexOf(disabilityId);
      if (index > -1) {
        selectedDisabilities.splice(index, 1);
      }
    }

    this.studentForm.patchValue({ selectedDisabilities });
  }

  onDisabilityChange(event: Event, disabilityId: string): void {
    const target = event.target as HTMLInputElement;
    this.onDisabilityToggle(disabilityId, target.checked);
  }

  isDisabilitySelected(disabilityId: string): boolean {
    const selectedDisabilities = this.studentForm.get('selectedDisabilities')?.value || [];
    return selectedDisabilities.includes(disabilityId);
  }

  onSubmit(): void {
    if (this.studentForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const formValue = this.studentForm.value;

    // ÉTAPE 1: Sanitiser les données du formulaire
    const sanitizedFormData = this.sanitizationService.sanitizeStudentFormData(formValue);

    // ÉTAPE 2: Préparer les données selon le schéma Prisma - OBJET PROPRE
    const studentData: CreateStudentRequest = {
      student_firstname: sanitizedFormData.student_firstname,
      student_lastname: sanitizedFormData.student_lastname,
      student_birthdate: sanitizedFormData.student_birthdate,
      student_place_of_birth: sanitizedFormData.student_place_of_birth,
      student_mail: sanitizedFormData.student_mail,
      student_phone: sanitizedFormData.student_phone,
      student_date_test_initial: sanitizedFormData.student_date_test_initial,
      student_date_entry_france: sanitizedFormData.student_date_entry_france,
      student_date_residence_permit: sanitizedFormData.student_date_residence_permit,
      student_date_cir: sanitizedFormData.student_date_cir,
      student_commentary: sanitizedFormData.student_commentary,
      
      // IDs obligatoires
      gender_uuid: sanitizedFormData.gender_uuid,
      french_level_uuid: sanitizedFormData.french_level_uuid,
      nationality_uuid: sanitizedFormData.nationality_uuid,
      financing_uuid: sanitizedFormData.financing_uuid,
      status_uuid: sanitizedFormData.status_uuid,
      orientation_uuid: sanitizedFormData.orientation_uuid,
      exit_reason_uuid: sanitizedFormData.exit_reason_uuid,
      
      // Handicaps
      disability_uuids: formValue.hasDisability ? formValue.selectedDisabilities : [],
    };

    // ÉTAPE 3: Envoi à l'API - création ou mise à jour selon le mode
    const apiCall = this.isEditMode && this.studentId
      ? this.studentService.updateStudent(this.studentId, studentData)
      : this.studentService.createStudent(studentData);

    apiCall.subscribe({
      next: () => {
        this.router.navigate(['/dashboard/apprenants']);
      },
      error: () => {
        this.error = this.isEditMode 
          ? 'Erreur lors de la mise à jour de l\'apprenant'
          : 'Erreur lors de la création de l\'apprenant';
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/apprenants']);
  }
}
