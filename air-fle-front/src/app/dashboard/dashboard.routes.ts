import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { PagePlaceholderComponent } from './shared/components/page-placeholder/page-placeholder.component';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      {
        path: '',
        component: HomeComponent,
      },
      {
        path: 'courses/:id/attendance',
        loadComponent: () => import('./pages/courses/attendance/course-attendance.page').then(c => c.CourseAttendancePage),
      },
      {
        path: 'groups',
        loadComponent: () =>
          import('./pages/groups/list/group-list.component').then(c => c.GroupListComponent),
      },
      {
        path: 'groups/create',
        loadComponent: () =>
          import('./pages/groups/create/group-create.component').then(c => c.GroupCreateComponent),
      },
      {
        path: 'groups/edit/:id',
        loadComponent: () =>
          import('./pages/groups/create/group-create.component').then(c => c.GroupCreateComponent),
      },
      {
        path: 'groups/:id',
        loadComponent: () =>
          import('./pages/groups/details/group-details.component').then(
            c => c.GroupDetailsComponent
          ),
      },
      {
        path: 'sessions',
        loadComponent: () =>
          import('./pages/sessions/list/session-list.component').then(c => c.SessionListComponent),
      },
      {
        path: 'sessions/create',
        loadComponent: () =>
          import('./pages/sessions/create/session-create.component').then(
            c => c.SessionCreateComponent
          ),
      },
      {
        path: 'sessions/edit/:id',
        loadComponent: () =>
          import('./pages/sessions/create/session-create.component').then(
            c => c.SessionCreateComponent
          ),
      },
      {
        path: 'sessions/:id',
        loadComponent: () =>
          import('./pages/sessions/details/session-details.component').then(
            c => c.SessionDetailsComponent
          ),
      },
      {
        path: 'courses',
        loadComponent: () =>
          import('./pages/courses/calendar/course-calendar.component').then(
            c => c.CourseCalendarComponent
          ),
      },
      {
        path: 'courses/create',
        loadComponent: () =>
          import('./pages/courses/create/course-create.component').then(
            c => c.CourseCreateComponent
          ),
      },
      {
        path: 'courses/edit/:id',
        loadComponent: () =>
          import('./pages/courses/create/course-create.component').then(
            c => c.CourseCreateComponent
          ),
      },
      {
        path: 'courses/:id',
        loadComponent: () =>
          import('./pages/courses/create/course-create.component').then(
            c => c.CourseCreateComponent
          ),
      },
      {
        path: 'apprenants',
        loadChildren: () =>
          import('./pages/apprenants/apprenants.module').then(m => m.ApprenantsModule),
      },
      {
        path: 'users',
        loadChildren: () => import('./pages/users/users.module').then(m => m.UsersModule),
      },
      {
        path: 'reference-data',
        loadChildren: () =>
          import('./pages/reference-data/reference-data.routes').then(m => m.REFERENCE_DATA_ROUTES),
      },
      {
        path: 'periodes',
        component: PagePlaceholderComponent,
        data: {
          title: 'Périodes',
          features: [
            'Calendrier des périodes',
            'Planification des sessions',
            'Gestion des disponibilités',
          ],
        },
      },
      {
        path: 'heures',
        component: PagePlaceholderComponent,
        data: {
          title: 'Heures travaillées',
          features: ['Suivi du temps de travail', 'Validation des heures', 'Rapports mensuels'],
        },
      },
      {
        path: 'adresses',
        component: PagePlaceholderComponent,
        data: {
          title: 'Adresses',
          features: ['Gestion des adresses', 'Informations de contact', 'Géolocalisation'],
        },
      },
      {
        path: 'examens',
        loadComponent: () => import('./pages/examens/examens.component').then(m => m.ExamensComponent),
        data: {
          title: 'Examens',
          features: [
            'Gestion des examens',
            'Création et modification',
            'Suivi des résultats',
          ],
        },
      },
      {
        path: 'parcours',
        loadComponent: () => import('./pages/parcours/parcours.component').then(m => m.ParcoursComponent),
        data: {
          title: 'Suivi de parcours',
          features: [
            'Visualisation des parcours',
            'Progression des apprenants',
            'Validation des compétences',
          ],
        },
      },
      {
        path: 'profile',
        component: PagePlaceholderComponent,
        data: {
          title: 'Profil',
          features: [
            'Informations personnelles',
            'Préférences utilisateur',
            'Historique des activités',
          ],
        },
      },
    ],
  },
];
