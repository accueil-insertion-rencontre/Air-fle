import { AuthService } from '@core/services';
import { Router } from '@angular/router';

import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface BreadcrumbItem {
  label: string;
  path?: string;
  active?: boolean;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  @Input() userName: string = '';
  @Input() pageTitle: string = 'Index';
  @Input() breadcrumbs: BreadcrumbItem[] = [
    { label: 'Général', path: '/dashboard' },
    { label: 'Utilisateurs', active: true },
  ];

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() openTicket = new EventEmitter<void>();
  @Output() openReleaseNotes = new EventEmitter<void>();

  showUserMenu: boolean = false;
  currentUserId: string = '';
  userDisplayName: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Obtenir l'ID de l'utilisateur connecté et son nom
    this.authService.currentUser$.subscribe(user => {
      
      
      if (user) {
        // Convertir l'ID en chaîne de caractères
        const userId = user.user_uuid || user.id;
        this.currentUserId = userId ? String(userId) : '';
        
        // Récupérer le nom d'utilisateur à partir de l'objet user
        // Essayer d'abord les propriétés de l'ancienne API, puis les nouvelles
        const firstName = user.firstname || user.user_firstname || '';
        const lastName = user.lastname || user.user_lastname || '';
        
        
        this.userDisplayName = `${firstName} ${lastName}`.trim();
        
        
        // Si le nom est vide, utiliser l'email comme fallback
        if (!this.userDisplayName && (user.email || user.user_mail)) {
          const email = user.email || user.user_mail;
          
          this.userDisplayName = email;
        }
        
        // Si toujours vide, utiliser un nom par défaut
        if (!this.userDisplayName) {
          
          this.userDisplayName = 'Utilisateur';
        }
        
        // Afficher la structure complète de l'objet user pour debug
        
      } else {
        
        this.userDisplayName = 'Utilisateur';
      }
    });
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  logout(): void {
    this.closeUserMenu();
    this.authService.logout();
  }

  goToMyProfile(): void {
    // Fermer le menu
    this.closeUserMenu();

    // Prendre l’ID courant depuis le subject sinon depuis le token
    let userId = this.currentUserId;
    if (!userId) {
      const tokenId = this.authService.getUserIdFromToken();
      if (tokenId) userId = tokenId;
    }

    if (userId) {
      // Forcer un rafraîchissement complet si on est déjà sur ce profil
      const targetUrl = `/dashboard/users/profile/${userId}`;
      if (this.router.url === targetUrl) {
        // Naviguer vers la même URL avec un paramètre de tick pour déclencher la réinit
        const tick = Date.now();
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigate([targetUrl], { queryParams: { r: tick } });
        });
      } else {
        this.router.navigate([targetUrl]);
      }
    }
  }

  onOpenTicket(): void {
    this.openTicket.emit();
  }

  onOpenReleaseNotes(): void {
    this.openReleaseNotes.emit();
  }
}
