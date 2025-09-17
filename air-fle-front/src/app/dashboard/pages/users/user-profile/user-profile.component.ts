import { AuthService } from '@core/services';

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { UserService } from '../user.service';
import { User } from '@core/models';
import { Role } from '../user.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class UserProfileComponent implements OnInit {
  user: User | null = null;
  loading = true;
  error: string | null = null;
  successMessage: string | null = null;
  editMode = false;
  userForm!: FormGroup;
  passwordForm!: FormGroup;
  showPasswordForm = false;
  passwordError: string | null = null;
  isSubmittingPassword = false;
  roles: Role[] = [];
  isSubmitting = false;
  isCurrentUser = false;

  // Propriétés pour la suppression
  showDeleteModal = false;
  showPasswordModal = false;
  password = '';
  confirmationChecked = false;
  deleteError: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const userId = params.get('id');
      if (userId) {
        this.loadUser(userId);
        this.loadRoles();

        // Vérifier si l'utilisateur est le même que l'utilisateur connecté
        this.checkIfCurrentUser(userId);
      } else {
        this.error = 'ID utilisateur manquant';
        this.loading = false;
      }
    });
  }

  // Vérifier si l'utilisateur affiché est l'utilisateur connecté
  checkIfCurrentUser(userId: string): void {
    this.authService.currentUser$.subscribe(currentUser => {
      const currentId = currentUser?.user_uuid || currentUser?.id || this.authService.getUserIdFromToken();
      if (currentId && String(currentId) === String(userId)) {
        this.isCurrentUser = true;
      } else {
        this.isCurrentUser = false;
      }
    });
  }

  loadUser(id: string): void {
    this.loading = true;
    this.error = null;

    this.userService.getUserById(id).subscribe({
      next: user => {
        this.user = user;
        if (this.user.user_birthdate) {
          (this.user as unknown as Record<string, unknown>)['age'] = this.calculateAge(this.user.user_birthdate);
        }
        this.loading = false;
        this.initForm();
        this.initPasswordForm();
      },
      error: () => {
        this.error = `Erreur: Impossible de charger les détails de l'utilisateur`;
        this.loading = false;
      },
    });
  }

  loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: roles => {
        this.roles = roles;
      },
      error: () => {
        this.error = `Erreur: Impossible de charger les rôles`;
      },
    });
  }

  initForm(): void {
    if (!this.user) return;

    // Conversion de la date au format YYYY-MM-DD pour l'input date
    let formattedBirthdate = '';
    if (this.user.user_birthdate) {
      const date = new Date(this.user.user_birthdate);
      if (!isNaN(date.getTime())) {
        formattedBirthdate = date.toISOString().split('T')[0];
      }
    }

    this.userForm = this.fb.group({
      firstname: [this.user.user_firstname || '', [Validators.required]],
      lastname: [this.user.user_lastname || '', [Validators.required]],
      email: [this.user.user_mail, [Validators.required, Validators.email]],
      birthdate: [formattedBirthdate],
      role_id: [this.user.role_uuid || this.user.role?.role_uuid || ''],
      isActive: [this.user.user_isactive === undefined ? true : this.user.user_isactive],
    });
  }

  initPasswordForm(): void {
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(g: FormGroup) {
    const newPassword = g.get('newPassword')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;

    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
    if (this.showPasswordForm) {
      this.initPasswordForm();
    } else {
      this.passwordForm.reset();
      this.passwordError = null;
    }
  }

  onPasswordSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordError = 'Veuillez corriger les erreurs dans le formulaire.';
      return;
    }

    this.isSubmittingPassword = true;
    this.passwordError = null;

    const passwordData = {
      currentPassword: this.passwordForm.get('currentPassword')?.value,
      newPassword: this.passwordForm.get('newPassword')?.value,
      confirmPassword: this.passwordForm.get('confirmPassword')?.value,
    };

    this.userService.updateUserPassword(passwordData).subscribe({
      next: () => {
        this.isSubmittingPassword = false;
        this.showPasswordForm = false;
        this.successMessage = 'Mot de passe mis à jour avec succès! Vous allez être déconnecté...';

        // Déconnecter l'utilisateur après 3 secondes (car les tokens sont invalidés)
        setTimeout(() => {
          // Utiliser le service d'authentification pour gérer la déconnexion
          this.authService.logout();
        }, 3000);
      },
      error: () => {
        this.isSubmittingPassword = false;
        this.passwordError = 'Erreur lors de la mise à jour du mot de passe';
      },
    });
  }

  calculateAge(birthdate: string): number {
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.initForm();
    }
  }

  toggleUserStatus(): void {
    if (this.userForm) {
      const currentValue = this.userForm.get('isActive')?.value;
      this.userForm.get('isActive')?.setValue(!currentValue);
    }
  }

  cancelEdit(): void {
    this.editMode = false;
    this.userForm.reset();
  }

  onSubmit(): void {
    if (this.userForm.invalid || !this.user) {
      this.error = 'Le formulaire contient des erreurs. Veuillez vérifier les champs.';
      return;
    }

    this.isSubmitting = true;
    this.error = null;
    this.successMessage = null;
    const userData = this.userForm.value;

    // Formater la date si nécessaire
    if (userData.birthdate) {
      try {
        // Vérifier si c'est déjà une date valide au format YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(userData.birthdate)) {
          const date = new Date(userData.birthdate);
          if (!isNaN(date.getTime())) {
            userData.birthdate = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
          } else {
            // Ne pas inclure la date si elle ne peut pas être formatée correctement
          }
        }
      } catch (error) {
        // Ne pas inclure la date si elle ne peut pas être formatée correctement
      }
    }

    this.userService.updateUser(this.user.user_uuid, userData).subscribe({
      next: updatedUser => {
        this.user = updatedUser;
        if (this.user.user_birthdate) {
          (this.user as unknown as Record<string, unknown>)['age'] = this.calculateAge(this.user.user_birthdate);
        }
        this.editMode = false;
        this.isSubmitting = false;
        this.successMessage = 'Utilisateur mis à jour avec succès!';

        // Masquer le message de succès après 3 secondes
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      },
      error: () => {
        this.isSubmitting = false;
        this.error = "Erreur lors de la mise à jour de l'utilisateur";
      },
    });
  }

  goBack(): void {
    this.router.navigate(['dashboard', 'users']);
  }

  // Méthodes pour la gestion des modales de suppression
  openDeleteModal(): void {
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
  }

  confirmDelete(): void {
    this.showDeleteModal = false;
    this.showPasswordModal = true;
    this.password = '';
    this.confirmationChecked = false;
    this.deleteError = null;
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.password = '';
    this.confirmationChecked = false;
  }

  deleteUser(): void {
    if (!this.user || !this.password || !this.confirmationChecked) {
      return;
    }

    // Dans un environnement réel, vous voudriez peut-être valider le mot de passe
    // sur le serveur avant de permettre la suppression

    this.userService.deleteUser(this.user.user_uuid).subscribe({
      next: () => {
        this.successMessage = 'Utilisateur supprimé avec succès!';
        this.showPasswordModal = false;

        // Rediriger vers la liste des utilisateurs après un court délai
        setTimeout(() => {
          this.router.navigate(['dashboard', 'users']);
        }, 1500);
      },
      error: () => {
        this.deleteError = `Erreur: Impossible de supprimer l'utilisateur`;
      },
    });
  }
}
