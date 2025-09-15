import { AuthService } from '@core/services';

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, Role, CreateUserDto } from '../user.service';
import { User } from '@core/models';
import { debounceTime } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  totalUsers = 0;
  loading = false;
  pageSize = 10;
  currentPage = 0;
  filterForm: FormGroup;
  emailFilter = new FormControl('');
  error: string | null = null;
  currentUserId: string = '';

  // Création d'utilisateur
  showModal = false;
  createUserForm: FormGroup;
  roles: Role[] = [];
  isSubmitting = false;
  errorMessage = '';

  // Mapping des rôles aux descriptions
  private roleDescriptions: { [key: string]: string } = {
    admin: 'Administration',
    teacher: 'Formateur',
    student: 'Apprenant',
    developer: 'Développeur',
    designer: 'UI/UX Design',
    executive: 'Project',
    manager: 'Organization',
    programmer: 'Developer',
  };

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.filterForm = this.fb.group({
      email: [''],
      role: [''],
    });

    this.createUserForm = this.fb.group({
      firstname: ['', [Validators.required, Validators.maxLength(100)]],
      lastname: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      birthdate: [null],
      role_id: ['', [Validators.required]],
      isActive: [true],
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.getCurrentUserId();
    this.loadRoles();

    // Utiliser emailFilter pour la recherche
    this.emailFilter.valueChanges.pipe(debounceTime(500)).subscribe(value => {
      this.filterForm.get('email')?.setValue(value);
      this.currentPage = 0;
      this.loadUsers();
    });

    this.filterForm
      .get('role')
      ?.valueChanges.pipe(debounceTime(500))
      .subscribe(() => {
        this.currentPage = 0;
        this.loadUsers();
      });
  }

  // Chargement des rôles
  loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: roles => {
        this.roles = roles;
      },
      error: error => {
        // Gestion silencieuse
      },
    });
  }

  // Afficher/masquer le modal
  showCreateUserModal(): void {
    this.showModal = true;
    this.createUserForm.reset({ isActive: true });
  }

  hideCreateUserModal(): void {
    this.showModal = false;
    this.errorMessage = '';
  }

  // Création d'un utilisateur
  createUser(): void {
    if (this.createUserForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.createUserForm.controls).forEach(key => {
        const control = this.createUserForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    // Récupérer les valeurs du formulaire
    const formValue = this.createUserForm.value;

    // Créer l'objet utilisateur à envoyer
    const userData: CreateUserDto = {
      user_firstname: formValue.firstname,
      user_lastname: formValue.lastname,
      user_mail: formValue.email,
      user_password: formValue.password,
      role_uuid: formValue.role_id,
      user_isactive: formValue.isActive,
    };

    // Ajouter la date de naissance si elle est présente
    if (formValue.birthdate) {
      userData.user_birthdate = formValue.birthdate;
    }

    this.userService.createUser(userData).subscribe({
      next: user => {
        this.isSubmitting = false;
        this.hideCreateUserModal();
        this.loadUsers(); // Recharger la liste des utilisateurs
      },
      error: error => {
        this.isSubmitting = false;

        // Gérer spécifiquement l'erreur 409 (Conflict)
        if (error.status === 409) {
          this.errorMessage = 'Un utilisateur avec cette adresse email existe déjà.';
        } else {
          this.errorMessage = `Erreur lors de la création de l'utilisateur: ${error.message || 'Veuillez réessayer plus tard.'}`;
        }
      },
    });
  }

  getCurrentUserId(): void {
    const token = this.authService.getToken();
    if (token) {
      try {
        // Décoder le token JWT (format: header.payload.signature)
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentUserId = payload.sub; // 'sub' contient l'ID de l'utilisateur
      } catch (error) {
        // Gestion silencieuse
      }
    }
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;
    const filters = this.filterForm.value;

    this.userService
      .getUsers({
        skip: this.currentPage * this.pageSize,
        take: this.pageSize,
        user_mail: filters.email || undefined,
        role_uuid: filters.role || undefined,
      })
      .subscribe({
        next: (response: any) => {
          // Gestion de différentes structures de réponse possibles
          if (response.data && Array.isArray(response.data)) {
            this.users = response.data;
            this.totalUsers = response.total || response.data.length;
          } else if (Array.isArray(response)) {
            this.users = response;
            this.totalUsers = response.length;
          } else {
            this.users = [];
            this.totalUsers = 0;
            this.error = 'Format de réponse inattendu';
          }

          this.loading = false;
        },
        error: error => {
          this.error = `Erreur: ${error.status} ${error.statusText}`;
          this.loading = false;
          this.users = [];
        },
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  get totalPages(): number {
    return Math.ceil(this.totalUsers / this.pageSize);
  }

  deleteUser(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.users = this.users.filter(user => user.user_uuid !== id);
          this.loadUsers();
        },
        error: error => {
          this.error = `Erreur lors de la suppression: ${error.status || ''} ${error.statusText || error.message || 'Erreur inconnue'}`;
        },
      });
    }
  }

  // Méthodes pour le design
  getUserInitials(user: User): string {
    const firstInitial = user.user_firstname ? user.user_firstname.charAt(0) : '';
    const lastInitial = user.user_lastname ? user.user_lastname.charAt(0) : '';
    return (firstInitial + lastInitial).toUpperCase();
  }

  getRoleDescription(roleId: string | undefined): string {
    if (!roleId) return 'Non assigné';
    
    // Chercher le rôle dans la liste des rôles chargés
    // Essayer toutes les variantes possibles d'ID
    const role = this.roles.find(r => 
      r.role_uuid === roleId ||
      r.role_uuid === roleId.toLowerCase()
    );
    
    if (role) {
      return role.role_name || 'Rôle inconnu';
    }
    

    
    // Fallback avec l'ancien mapping si le rôle n'est pas trouvé
    return this.roleDescriptions[roleId.toLowerCase()] || `Rôle: ${roleId}`;
  }

  formatDate(dateString: string | Date | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(2)}`;
  }

  getDaysCount(dateString: string | Date | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays}`;
  }

  editUser(id: string): void {
    this.router.navigate(['dashboard', 'users', 'profile', id]);
  }
}
