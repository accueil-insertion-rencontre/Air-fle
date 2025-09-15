import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const loggedInGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si l'utilisateur est déjà connecté, rediriger vers le dashboard
  if (authService.isLoggedIn()) {
    return router.createUrlTree(['/dashboard']);
  }

  // Sinon, autoriser l'accès à la page de login
  return true;
};
