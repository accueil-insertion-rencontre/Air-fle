import { AlertService, GroupService, SessionService } from '@core/services';

import { Session, Group } from '@core/models';

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';

// Bootstrap supprimé: on gère la modale en CSS/Angular

@Component({
  selector: 'app-session-details',
  templateUrl: './session-details.component.html',
  styleUrls: ['./session-details.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
})
export class SessionDetailsComponent implements OnInit {
  sessionId!: string | number;
  session: Session | null = null;
  groups: Group[] = [];
  loading = true;

  // Propriétés pour la modal de création de groupe
  groupForm: FormGroup;
  groupLoading = false;
  error = '';
  submitted = false;
  isCreateGroupOpen = false;
  allGroups: Group[] = [];
  selectedExistingGroupId: string | number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService,
    private groupService: GroupService,
    private formBuilder: FormBuilder,
    private alertService: AlertService
  ) {
    // Initialiser le formulaire de groupe
    this.groupForm = this.formBuilder.group({
      label: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {


        // L'ID peut être soit un number soit un string (UUID)
        const rawId = params['id'];

        // Essayer de convertir en number si c'est numérique
        if (!isNaN(+rawId) && rawId !== '') {
          this.sessionId = +rawId;

        } else {
          this.sessionId = rawId;

        }

        this.loadSession();
      }
    });
  }

  loadSession(): void {


    // Pour l'API, on utilise l'ID tel quel
    const apiId = this.sessionId;


    this.sessionService.getSessionById(apiId as number).subscribe({
      next: data => {

        this.session = data;

        // Utiliser les groupes inclus dans la session
        if (this.session.groups) {
          this.groups = this.session.groups;

          
          // Charger les détails complets de chaque groupe pour avoir les étudiants
          this.loadGroupsDetails();
        } else {
          this.groups = [];

        }

        this.loading = false;
      },
      error: (err: Error) => {
        // console.error('Erreur lors du chargement de la session', err);
        this.loading = false;
      },
    });
  }

  // Convertit une date au format string en objet Date
  parseDate(dateValue: string | Date | undefined): Date | null {
    if (!dateValue) return null;

    if (typeof dateValue === 'string') {
      return new Date(dateValue);
    }

    return dateValue;
  }

  // Calcule le nombre de jours entre deux dates
  calculateDuration(): number {
    const startedAt = this.session?.session_started_at || this.session?.started_at;
    const finishedAt = this.session?.session_finished_at || this.session?.finished_at;
    
    if (!startedAt || !finishedAt) return 0;

    const startDate = new Date(startedAt);
    const endDate = new Date(finishedAt);

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  // Calcule le nombre total d'étudiants dans tous les groupes de la session
  getTotalStudents(): number {
    return this.groups.reduce((total, group) => {
      return total + this.getStudentCount(group);
    }, 0);
  }

  // Obtient le nombre d'étudiants d'un groupe avec fallback
  getStudentCount(group: Group): number {
    
    if (!group) return 0;
    
    // Essayer différentes propriétés pour les étudiants
    const students = group.students || (group as Record<string, unknown>)['student'] || (group as Record<string, unknown>)['students_list'] || [];
    const count = Array.isArray(students) ? students.length : 0;
    return count;
  }

  // Obtient le nom du groupe avec fallback
  getGroupLabel(group: Group): string {
    
    if (!group) return 'Groupe sans nom';
    const result = group.group_label || group.label || 'Groupe sans nom';
    
    return result;
  }

  // Obtient l'ID du groupe avec fallback
  getGroupId(group: unknown): string | number {
    
    if (!group) return '';
    
    const g = group as Record<string, unknown>;
    const groupId = g['group_id'] || g['id'] || g['group_uuid'] || g['uuid'] || '';
    
    return groupId as string | number;
  }

  // Charge les détails complets de chaque groupe pour avoir les étudiants
  loadGroupsDetails(): void {
    
    
    this.groups.forEach((group, index) => {
      const groupId = this.getGroupId(group);
      if (groupId) {
        
        
        this.groupService.getGroupById(groupId).subscribe({
          next: (detailedGroup) => {

            
            // Mettre à jour le groupe avec les détails complets
            this.groups[index] = { ...group, ...detailedGroup };
            
            
          },
          error: (error) => {
            // console.error(`❌ SESSION-DETAILS - Erreur lors du chargement du groupe ${index}:`, error);
          }
        });
      }
    });
  }

  // Méthodes pour la modale création de groupe (sans Bootstrap)
  openCreateGroupModal(): void {
    this.error = '';
    this.submitted = false;
    this.groupForm.reset();
    this.isCreateGroupOpen = true;
    // Charger les groupes existants pour l'association
    this.groupService.getGroups().subscribe({
      next: (groups)=>{ this.allGroups = groups || []; },
      error: ()=>{ this.allGroups = []; }
    });
  }

  onSubmitGroup(): void {
    this.submitted = true;
    this.error = '';

    if (this.groupForm.invalid) {
      return;
    }

    this.groupLoading = true;

    // Préparer les données avec la session pré-sélectionnée (API format)
    const groupData = {
      group_label: this.groupForm.value.label,
      session_uuid: String(this.session?.session_uuid || this.sessionId),
    };



    this.groupService.createGroup(groupData).subscribe({
      next: () => {
        this.groupLoading = false;
        this.isCreateGroupOpen = false;

        // Recharger la session pour récupérer les groupes mis à jour
        this.loadSession();
      },
      error: (error: Error & { error?: { message?: string }; message?: string }) => {
        this.error =
          error?.error?.message ||
          error?.message ||
          'Une erreur est survenue lors de la création du groupe';
        this.groupLoading = false;
      },
    });
  }

  // Associer un groupe existant à cette session
  attachExistingGroup(): void {
    if (!this.selectedExistingGroupId || !this.sessionId) return;
    // Ici, l’API idéale: PATCH /groups/:id { session_uuid }
    const payload = { session_uuid: this.session?.session_uuid || this.sessionId } as Partial<Group>;
    this.groupService.updateGroup(this.selectedExistingGroupId, payload).subscribe({
      next: ()=>{ this.isCreateGroupOpen = false; this.loadSession(); },
      error: (err: Error & { error?: { message?: string } })=>{ this.error = err?.error?.message || 'Impossible d\'associer le groupe'; }
    });
  }

  // Vérifie si un champ du formulaire est invalide
  isFieldInvalid(fieldName: string): boolean {
    const control = this.groupForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched || this.submitted));
  }

  deleteSession(): void {
    if (!this.session) return;

    this.alertService
      .confirm(
        `Êtes-vous sûr de vouloir supprimer la session "${this.session.session_label || this.session.label}" ?\n\n` +
          'Cette action est irréversible et supprimera également tous les groupes et étudiants associés.',
        'Supprimer la session'
      )
      .then(confirmed => {
        if (confirmed) {
          this.sessionService.deleteSession(this.sessionId).subscribe({
            next: () => {
              this.alertService.success('Session supprimée avec succès !').then(() => {
                this.router.navigate(['/dashboard/sessions']);
              });
            },
            error: (err: Error) => {
              // console.error('Erreur lors de la suppression de la session', err);
              this.alertService.error('Erreur lors de la suppression. Veuillez réessayer.');
            },
          });
        }
      });
  }
}
