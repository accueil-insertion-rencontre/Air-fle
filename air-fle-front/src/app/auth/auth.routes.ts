import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { loggedInGuard } from '../core/guards/logged-in.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [loggedInGuard],
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
