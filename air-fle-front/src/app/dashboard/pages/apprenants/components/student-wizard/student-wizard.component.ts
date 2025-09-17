import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { StudentService } from '@core/services';
import { CreateStudentRequest } from '@core/models';
import { ReferenceDataService } from '@core/services';
import { Gender, Nationality, FrenchLevel, Status, Financing, Orientation, Disability } from '@core/models';

interface WizardStep {
  id: number;
  title: string;
  isCompleted: boolean;
  isActive: boolean;
}

@Component({
  selector: 'app-student-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-wizard.component.html',
  styleUrls: ['./student-wizard.component.scss'],
})
export class StudentWizardComponent implements OnInit {
  // Forms pour chaque étape
  personalInfoForm!: FormGroup;
  contactForm!: FormGroup;
  administrativeForm!: FormGroup;
  additionalForm!: FormGroup;

  // Données de référence
  genders: Gender[] = [];
  nationalities: Nationality[] = [];
  frenchLevels: FrenchLevel[] = [];
  statuses: Status[] = [];
  financings: Financing[] = [];
  orientations: Orientation[] = [];
  disabilities: Disability[] = [];

  // État du wizard
  currentStep = 1;
  totalSteps = 4;
  isSubmitting = false;
  error: string | null = null;
  studentId: string | null = null;
  isEditMode = false;

  steps: WizardStep[] = [
    { id: 1, title: 'Informations personnelles', isCompleted: false, isActive: true },
    { id: 2, title: 'Contact & Adresse', isCompleted: false, isActive: false },
    { id: 3, title: 'Informations administratives', isCompleted: false, isActive: false },
    { id: 4, title: 'Informations complémentaires', isCompleted: false, isActive: false },
  ];

  constructor(
    private fb: FormBuilder,
    private studentService: StudentService,
    private referenceDataService: ReferenceDataService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    // Récupérer l'ID de l'apprenant depuis la route
    this.studentId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.studentId;
    
    this.loadReferenceData();
    
    // Note: Le chargement des données de l'étudiant se fait maintenant
    // dans loadReferenceData() après que les nationalités soient chargées
  }



  private initializeForms(): void {
    // Étape 1 : Informations personnelles
    this.personalInfoForm = this.fb.group({
      firstname: ['', [Validators.required, Validators.minLength(2)]],
      lastname: ['', [Validators.required, Validators.minLength(2)]],
      birthdate: ['', Validators.required],
      placeOfBirth: [''],
      gender_id: ['', Validators.required],
    });

    // Étape 2 : Contact & Adresse
    this.contactForm = this.fb.group({
      email: ['', [Validators.email]],
      phone: ['', [Validators.pattern(/^[+]?[0-9\s\-()]{8,15}$/)]],
      address: [''],
      city: [''],
      postalCode: [''],
      country: ['France'],
    });

    // Étape 3 : Informations administratives
    this.administrativeForm = this.fb.group({
      nationality_id: ['', Validators.required],
      initial_level_id: ['', Validators.required],
      current_level_id: [''],
      status_id: ['', Validators.required],
      financing_id: ['', Validators.required],
      date_entree_france: [''],
      date_titre_sejour: [''],
      date_cir: [''],
    });

    // Étape 4 : Informations complémentaires
    this.additionalForm = this.fb.group({
      date_test_initial: [''],
      orientation_id: [''],
      hasDisability: [false],
      disability_ids: [[]],
      commentaire: [''],
    });
  }

  private loadReferenceData(): void {
    // Charger toutes les données de référence en parallèle
    this.referenceDataService.getGenders().subscribe(data => (this.genders = data));
    this.referenceDataService.getNationalities().subscribe(data => {
      this.nationalities = data;
      
      // Si on est en mode édition et que les données de référence sont chargées,
      // on peut maintenant charger les données de l'étudiant
      if (this.isEditMode && this.studentId) {
        this.loadStudentData(this.studentId!);
      }
    });
    this.referenceDataService.getFrenchLevels().subscribe(data => (this.frenchLevels = data));
    this.referenceDataService.getStatuses().subscribe(data => (this.statuses = data));
    this.referenceDataService.getFinancings().subscribe(data => (this.financings = data));
    this.referenceDataService.getOrientations().subscribe(data => (this.orientations = data));
    this.referenceDataService.getDisabilities().subscribe(data => (this.disabilities = data));
  }

  private loadStudentData(studentId: string): void {
    this.studentService.getStudentById(studentId).subscribe({
      next: (student) => {
        // Préremplir le formulaire étape 1 - Informations personnelles
        this.personalInfoForm.patchValue({
          firstname: student.student_firstname || '',
          lastname: student.student_lastname || '',
          birthdate: student.student_birthdate ? new Date(student.student_birthdate).toISOString().split('T')[0] : '',
          placeOfBirth: student.student_place_of_birth || '',
          gender_id: student.gender_uuid || '',
        });

        // Préremplir le formulaire étape 2 - Contact & Adresse
        this.contactForm.patchValue({
          email: student.student_mail || '',
          phone: student.student_phone ? student.student_phone.toString() : '',
          // Note: Les adresses ne sont pas encore dans le modèle
        });

        // Extraire la nationalité depuis le tableau nationalities (structure: nationalities[0].nationality.nationality_uuid)
        const studentNationality = student.nationalities && student.nationalities.length > 0 
          ? (student.nationalities[0].nationality?.nationality_uuid || '') 
          : '';
        
        // Préremplir le formulaire étape 3 - Informations administratives
        this.administrativeForm.patchValue({
          nationality_id: studentNationality,
          initial_level_id: student.french_level_uuid || '',
          current_level_id: '', // Pas de niveau actuel dans le modèle
          status_id: student.status_uuid || '',
          financing_id: student.financing_uuid || '',
          date_entree_france: student.student_date_entry_france ? new Date(student.student_date_entry_france).toISOString().split('T')[0] : '',
          date_titre_sejour: student.student_date_residence_permit ? new Date(student.student_date_residence_permit).toISOString().split('T')[0] : '',
          date_cir: student.student_date_cir ? new Date(student.student_date_cir).toISOString().split('T')[0] : '',
        });

        // Préremplir le formulaire étape 4 - Informations complémentaires
        this.additionalForm.patchValue({
          orientation_id: student.orientation_uuid || '',
          exit_reason_id: student.exit_reason_uuid || '',
          date_test_initial: student.student_date_test_initial ? new Date(student.student_date_test_initial).toISOString().split('T')[0] : '',
          commentaire: student.student_commentary || '',
          // Récupérer les handicaps depuis l'API
          hasDisability: student.disabilities && student.disabilities.length > 0,
          disability_ids: student.disabilities ? 
            student.disabilities.map((d: { disability_uuid?: string }) => d.disability_uuid || '').filter(id => id !== '') : []
        });
      },
      error: () => {
        this.error = 'Erreur lors du chargement des données de l\'apprenant';
      }
    });
  }

  // Navigation entre étapes
  nextStep(): void {
    if (this.isCurrentStepValid()) {
      this.steps[this.currentStep - 1].isCompleted = true;
      this.steps[this.currentStep - 1].isActive = false;

      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        this.steps[this.currentStep - 1].isActive = true;
      }
    } else {
      this.markCurrentFormAsTouched();
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.steps[this.currentStep - 1].isActive = false;
      this.currentStep--;
      this.steps[this.currentStep - 1].isActive = true;
    }
  }

  goToStep(stepNumber: number): void {
    if (stepNumber <= this.currentStep || this.steps[stepNumber - 1].isCompleted) {
      this.steps[this.currentStep - 1].isActive = false;
      this.currentStep = stepNumber;
      this.steps[this.currentStep - 1].isActive = true;
    }
  }

  private isCurrentStepValid(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.personalInfoForm.valid;
      case 2:
        return this.contactForm.valid;
      case 3:
        return this.administrativeForm.valid;
      case 4:
        return this.additionalForm.valid;
      default:
        return false;
    }
  }

  private markCurrentFormAsTouched(): void {
    switch (this.currentStep) {
      case 1:
        this.markFormGroupTouched(this.personalInfoForm);
        break;
      case 2:
        this.markFormGroupTouched(this.contactForm);
        break;
      case 3:
        this.markFormGroupTouched(this.administrativeForm);
        break;
      case 4:
        this.markFormGroupTouched(this.additionalForm);
        break;
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Validation et helpers
  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return `Ce champ est requis`;
    if (field.errors['email']) return "Format d'email invalide";
    if (field.errors['minlength'])
      return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
    if (field.errors['pattern']) return 'Format invalide';
    if (field.errors['containsHtml']) return field.errors['containsHtml'].message;

    return 'Champ invalide';
  }

  // Gestion des handicaps (multiple sélection)
  toggleDisability(disabilityId: string): void {
    const currentDisabilities = this.additionalForm.get('disability_ids')?.value || [];
    const index = currentDisabilities.indexOf(disabilityId);

    if (index > -1) {
      currentDisabilities.splice(index, 1);
    } else {
      currentDisabilities.push(disabilityId);
    }

    this.additionalForm.patchValue({ disability_ids: currentDisabilities });
  }

  isDisabilitySelected(disabilityId: string): boolean {
    const currentDisabilities = this.additionalForm.get('disability_ids')?.value || [];
    return currentDisabilities.includes(disabilityId);
  }

  // Soumission finale
  onSubmit(): void {
    if (!this.areAllFormsValid()) {
      this.markCurrentFormAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const rawStudentData = this.buildStudentData();

    // Envoi à l'API - création ou mise à jour selon le mode
    const apiCall = this.isEditMode && this.studentId
      ? this.studentService.updateStudent(this.studentId, rawStudentData)
      : this.studentService.createStudent(rawStudentData);

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

  public areAllFormsValid(): boolean {
    return (
      this.personalInfoForm.valid &&
      this.contactForm.valid &&
      this.administrativeForm.valid &&
      this.additionalForm.valid
    );
  }

  private buildStudentData(): CreateStudentRequest {
    const personal = this.personalInfoForm.value;
    const contact = this.contactForm.value;
    const admin = this.administrativeForm.value;
    const additional = this.additionalForm.value;

    // Préparer les données brutes
    const rawStudentData: Record<string, unknown> = {
      // Informations personnelles obligatoires
      student_firstname: personal.firstname,
      student_lastname: personal.lastname,
      student_birthdate: new Date(personal.birthdate),
      gender_uuid: personal.gender_id,

      // Informations administratives obligatoires selon le schéma Prisma
      french_level_uuid: admin.initial_level_id,
      nationality_uuid: admin.nationality_id,
      financing_uuid: admin.financing_id,
      status_uuid: admin.status_id,
    };

    // Ajouter les champs optionnels s'ils sont renseignés
    if (personal.placeOfBirth) {
      rawStudentData['student_place_of_birth'] = personal.placeOfBirth;
    }
    if (contact.email) {
      rawStudentData['student_mail'] = contact.email;
    }
    if (contact.phone) {
      rawStudentData['student_phone'] = contact.phone;
    }
    if (admin.date_entree_france) rawStudentData['student_date_entry_france'] = new Date(admin.date_entree_france);
    if (admin.date_titre_sejour) rawStudentData['student_date_residence_permit'] = new Date(admin.date_titre_sejour);
    if (admin.date_cir) rawStudentData['student_date_cir'] = new Date(admin.date_cir);
    if (additional.date_test_initial) rawStudentData['student_date_test_initial'] = new Date(additional.date_test_initial);
    if (additional.commentaire) rawStudentData['student_commentary'] = additional.commentaire;
    
    // Ajouter les handicaps si présents
    if (additional.hasDisability && additional.disability_ids && additional.disability_ids.length > 0) {
      rawStudentData['disability_uuids'] = additional.disability_ids;
    }

    // ✅ Angular protège automatiquement les données des formulaires

    return rawStudentData as unknown as CreateStudentRequest;
  }

  // Navigation
  cancel(): void {
    this.router.navigate(['/dashboard/apprenants']);
  }

  // Utilitaires
  getStepIcon(step: WizardStep): string {
    if (step.isCompleted) return '✓';
    if (step.isActive) return step.id.toString();
    return step.id.toString();
  }
}
