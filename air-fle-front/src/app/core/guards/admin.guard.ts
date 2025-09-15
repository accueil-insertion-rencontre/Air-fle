import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Vérifier si l'utilisateur est connecté
  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/auth/login']);
  }

  // Vérifier si l'utilisateur est un administrateur
  const token = authService.getToken();
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role === 'admin') {
        return true;
      }
    } catch (error) {
      // Gestion silencieuse de l'erreur
    }
  }

  // Si l'utilisateur n'est pas un administrateur, rediriger vers le dashboard sans alerte
  return router.createUrlTree(['/dashboard']);
};
