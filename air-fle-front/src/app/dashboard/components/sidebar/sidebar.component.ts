import { AuthService } from '@core/services';

import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  NgZone,
  ChangeDetectorRef, OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd, Event } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  active: boolean;
  section?: string;
  requiredRole?: string; // Rôle requis pour voir cet élément de menu
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() isOpen: boolean = true;
  @Output() isOpenChange = new EventEmitter<boolean>();

  private routerSubscription: Subscription | null = null;
  private pendingIconReplacement = false;

  allMenuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'home',
      route: '/dashboard',
      active: false,
    },
    {
      label: 'Utilisateurs',
      icon: 'users',
      route: '/dashboard/users',
      active: false,
      requiredRole: 'admin', // Seuls les administrateurs peuvent voir cet élément
    },
    {
      label: 'Données de Référence',
      icon: 'database',
      route: '/dashboard/reference-data',
      active: false,
      requiredRole: 'admin',
    },
    {
      label: 'Apprenants',
      icon: 'user',
      route: '/dashboard/apprenants',
      active: false,
      section: 'Apprenants',
    },
    {
      label: 'Examens',
      icon: 'clipboard',
      route: '/dashboard/examens',
      active: false,
    },
    {
      label: 'Suite de parcours',
      icon: 'trending-up',
      route: '/dashboard/parcours',
      active: false,
    },
    {
      label: 'Sessions',
      icon: 'calendar',
      route: '/dashboard/sessions',
      active: false,
      section: 'Formation',
    },
    {
      label: 'Groupes',
      icon: 'users',
      route: '/dashboard/groups',
      active: false,
    },
    {
      label: 'Cours',
      icon: 'book-open',
      route: '/dashboard/courses',
      active: false,
    },
  ];

  // Éléments de menu filtrés en fonction du rôle de l'utilisateur
  menuItems: MenuItem[] = [];
  userRole: string = '';

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private changeDetectorRef: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Récupérer le rôle de l'utilisateur depuis le token JWT
    this.getUserRole();

    // Filtrer les éléments de menu en fonction du rôle
    this.filterMenuItems();

    // Initialiser la route active au chargement initial
    this.handleRouteChange(this.router.url);

    // S'abonner aux changements de route
    this.routerSubscription = this.router.events
      .pipe(filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.handleRouteChange(event.url);
      });
  }

  ngOnDestroy(): void {
    // Nettoyer la souscription pour éviter les fuites mémoire
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
      this.routerSubscription = null;
    }
  }


  // plus de réinitialisation Feather: icônes en SVG inline
  forceIconRefresh(): void {}

  // Récupérer le rôle de l'utilisateur depuis le token JWT
  getUserRole(): void {
    const token = this.authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.userRole = payload.role;
      } catch {
        // Gestion silencieuse de l'erreur
      }
    }
  }

  // Filtrer les éléments de menu en fonction du rôle de l'utilisateur
  filterMenuItems(): void {
    this.menuItems = this.allMenuItems.filter(item => {
      // Si l'élément n'a pas de rôle requis, le montrer à tous les utilisateurs
      if (!item.requiredRole) {
        return true;
      }

      // Sinon, vérifier si l'utilisateur a le rôle requis
      return this.userRole === item.requiredRole;
    });
  }

  // Méthodes pour filtrer les éléments du menu par section
  getDashboardItems() {
    return this.menuItems.filter(item => !item.section || item.section === '');
  }
  
  getApprenantsItems() {
    return this.menuItems.filter(item => item.section === 'Apprenants');
  }
  
  getFormationItems() {
    return this.menuItems.filter(item => item.section === 'Formation');
  }

  // Gestion de changement de route
  private handleRouteChange(url: string): void {
    
    
    // Réinitialiser tous les éléments
    this.resetAllItems();

    // Mettre à jour l'état actif en fonction de l'URL
    this.setActiveRoute(url);

    // Forcer la détection de changements
    this.changeDetectorRef.detectChanges();

    // plus d'appel à Feather: les icônes sont inline
  }

  // Réinitialiser tous les éléments
  private resetAllItems(): void {
    this.menuItems.forEach(item => {
      item.active = false;
    });
  }

  // Feather supprimé

  // Définir la route active
  setActiveRoute(url: string): void {
    // Cas spécial pour le dashboard - actif uniquement si on est exactement sur /dashboard
    if (url === '/dashboard') {
      const dashboardItem = this.menuItems.find(item => item.route === '/dashboard');
      if (dashboardItem) {
        dashboardItem.active = true;
      }
      return;
    }

    // Pour les autres routes, trouver l'élément correspondant le plus spécifique
    let mostSpecificRoute = '';
    let mostSpecificItem: MenuItem | null = null;

    for (const item of this.menuItems) {
      if (
        item.route !== '/dashboard' &&
        url.startsWith(item.route) &&
        item.route.length > mostSpecificRoute.length
      ) {
        mostSpecificRoute = item.route;
        mostSpecificItem = item;
      }
    }

    if (mostSpecificItem) {
      mostSpecificItem.active = true;
    }
  }

  // Toggle la sidebar et émet l'événement au composant parent
  toggleSidebar(): void {
    this.isOpen = !this.isOpen;
    this.isOpenChange.emit(this.isOpen);
  }

  // Mapping FA supprimé
}
