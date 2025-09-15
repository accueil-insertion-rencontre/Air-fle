import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StudentService } from '@core/services';
import { StudentListResponse } from '@core/models';
import { ReferenceDataService, GroupService } from '@core/services';
import {
  StudentFilters,
  StudentListConfig,
} from '@core/models';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.scss'],
})
export class StudentListComponent implements OnInit {
  students: any[] = []; // Utilisation de any[] temporairement pour gérer les différences de structure
  loading = false;
  error: string | null = null;
  currentPage = 1;
  pageSize = 20; // Forcer à 20 élèves par page
  totalItems = 0;
  totalPages = 1;
  showCreateModal = false; // Pour gérer l'affichage de la modal
  showAdvancedFilters = false;
  filters: StudentFilters = {
    student_firstname: '',
    student_lastname: '',
    student_mail: '',
    french_level_uuid: '',
    status_uuid: '',
    nationality_uuid: '',
    group_uuid: '',
    financing_uuid: '',
    orientation_uuid: '',
  };

  // Données de référence pour le mapping
  statuses: any[] = [];
  nationalities: any[] = [];
  frenchLevels: any[] = [];
  groups: any[] = [];
  financings: any[] = [];
  orientations: any[] = [];

  // Remplacer l'observable par une méthode synchrone fiable
  isReallyMobile(): boolean {
    return window.innerWidth <= 768;
  }

  constructor(
    private studentService: StudentService,
    private referenceDataService: ReferenceDataService,
    private groupService: GroupService,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.loadReferenceData();
    this.loadStudents();
  }

  private loadReferenceData(): void {
    // Charger les données de référence pour faire le mapping
    this.referenceDataService.getStatuses().subscribe(data => {
      this.statuses = data;
    });

    this.referenceDataService.getNationalities().subscribe(data => {
      this.nationalities = data;
    });

    this.referenceDataService.getFrenchLevels().subscribe(data => {
      this.frenchLevels = data;
    });

    this.groupService.getGroups().subscribe(data => {
      this.groups = data;
    });

    this.referenceDataService.getFinancings().subscribe(data => {
      this.financings = data;
    });

    this.referenceDataService.getOrientations().subscribe(data => {
      this.orientations = data;
    });
  }

  loadStudents(): void {
    this.loading = true;
    this.error = null;

    // Ne garder que les filtres renseignés
    const nonEmptyFilters: any = {};
    Object.entries(this.filters).forEach(([key, value]) => {
      if (value && value !== '') {
        nonEmptyFilters[key] = value;
      }
    });

    const config: StudentListConfig = {
      page: this.currentPage,
      pageSize: this.pageSize,
      filters: nonEmptyFilters,
      sort: undefined,
    };

    this.studentService.getStudents(config).subscribe({
      next: (result: StudentListResponse) => {
        this.students = result.students || [];
        this.totalItems = result.total || 0;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.loading = false;
      },
      error: () => {
        this.error = 'Erreur lors du chargement des apprenants';
        this.loading = false;
      },
    });
  }

  getStudentInitials(student: any): string {
    // Utiliser les vraies propriétés de l'API Prisma
    const firstName = student.student_firstname || '';
    const lastName = student.student_lastname || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  getStudentName(student: any): string {
    // Utiliser les vraies propriétés de l'API Prisma
    const firstName = student.student_firstname || '';
    const lastName = student.student_lastname || '';
    return `${firstName} ${lastName}`.trim();
  }

  getStudentEmail(student: any): string {
    // Utiliser la vraie propriété de l'API Prisma
    return student.student_mail || 'Non renseigné';
  }

  getStudentLevel(student: any): string {
    // Utiliser l'objet frenchLevel directement de l'API Prisma
    if (student.frenchLevel) {
      return `${student.frenchLevel.french_level_code} - ${student.frenchLevel.french_level_description}`;
    }
    return 'Non défini';
  }

  getStudentStatus(student: any): string {
    // Utiliser l'objet status directement de l'API Prisma
    if (student.status) {
      return student.status.status_label;
    }
    return 'Non défini';
  }

  getStudentNationality(student: any): string {
    try {
      // Vérifier d'abord le tableau nationalities
      if (student.nationalities && student.nationalities.length > 0) {
        const firstNationality = student.nationalities[0] as any;
        
        // Essayer d'accéder à nationality.nationality_label
        if (firstNationality.nationality && firstNationality.nationality.nationality_label) {
          return firstNationality.nationality.nationality_label;
        }
      }
    } catch (error) {
      // Erreur silencieuse en production
    }
    
    // Fallback avec les données de référence si nécessaire
    if (student.nationality_uuid && this.nationalities.length > 0) {
      const nationality = this.nationalities.find(n => n.id === student.nationality_uuid);
      return nationality?.label || 'Non renseignée';
    }
    
    return 'Non renseignée';
  }

  // Méthodes de pagination
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadStudents();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.changePage(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.changePage(this.currentPage + 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    // Ajuster le début si on est proche de la fin
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Méthodes de recherche et filtrage
  onSearch(searchTerm: string): void {
    this.filters = {
      ...this.filters,
      search: searchTerm
    };
    this.currentPage = 1;
    this.loadStudents();
  }

  clearFilters(): void {
    this.filters = {
      student_firstname: '',
      student_lastname: '',
      student_mail: '',
      french_level_uuid: '',
      status_uuid: '',
      nationality_uuid: '',
      group_uuid: '',
      financing_uuid: '',
      orientation_uuid: '',
      search: ''
    };
    this.currentPage = 1;
    this.loadStudents();
  }

  applyAdvancedFilters(): void {
    this.currentPage = 1;
    this.loadStudents();
  }

  deleteStudent(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet apprenant ?')) {
      this.studentService.deleteStudent(id).subscribe({
        next: () => {
          // Si on supprime le dernier élément d'une page, revenir à la page précédente
          if (this.students.length === 1 && this.currentPage > 1) {
            this.currentPage--;
          }
          this.loadStudents();
        },
        error: () => {
          console.error('Erreur lors de la suppression');
          alert("Erreur lors de la suppression de l'étudiant");
        },
      });
    }
  }

  // Méthode utilitaire pour l'affichage
  getDisplayRange(): string {
    const count = this.totalItems || this.students.length;
    if (count === 0) return '0 résultat';

    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, count);

    return `${start}-${end} sur ${count}`;
  }

  // Méthodes pour gérer la modal
  openCreateModal(): void {
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  createSingleStudent(): void {
    this.closeCreateModal();
    this.router.navigate(['/dashboard/apprenants/new']);
  }

  importFromExcel(): void {
    this.closeCreateModal();
    this.router.navigate(['/dashboard/apprenants/import']);
  }
}
