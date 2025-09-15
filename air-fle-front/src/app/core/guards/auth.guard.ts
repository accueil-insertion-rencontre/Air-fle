import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si l'utilisateur est connecté, autoriser l'accès
  if (authService.isLoggedIn()) {
    return true;
  }

  // Sinon, rediriger vers la page de login
  return router.createUrlTree(['/auth/login']);
};
