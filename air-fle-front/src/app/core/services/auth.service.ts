import { environment } from '@environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { CookieService } from './cookie.service';
import { User } from '../models';

export interface AuthResponse {
  success: boolean;
  access_token?: string;
  user?: User;
  message?: string;
  data?: {
    access_token: string;
    user: User;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private cookieService: CookieService
  ) {}

  login(email: string, password: string): Observable<AuthResponse> {
    const url = `${this.apiUrl}/auth/login`;
    const payload = { email, password };

    

    return this.http.post<AuthResponse>(url, payload).pipe(
      tap((response: AuthResponse) => {

        
        try {
          // Vérifier si la réponse contient un token dans data.access_token
          if (response?.data?.access_token) {
            const token = response.data.access_token;


            // Stocker le token dans un cookie sécurisé
            this.cookieService.setSecureToken(token);

            // Mettre à jour l'utilisateur courant
            if (response.data.user) {
  
              this.currentUserSubject.next(response.data.user);
            }
          }
        } catch (error) {
          // console.error('🔐 LOGIN - Erreur lors du traitement de la réponse:', error);
        }
      })
    );
  }

  logout(): void {
    const url = `${this.apiUrl}/auth/logout`;

    // Récupération du token pour l'envoyer au backend
    const token = this.getToken();

    if (token) {
      // Appel API pour la déconnexion côté serveur
      this.http.post(url, {}).subscribe({
        next: () => {
          this.clearAuthData();
        },
        error: () => {
          this.clearAuthData();
        },
      });
    } else {
      // Si pas de token, simplement nettoyer les cookies
      this.clearAuthData();
    }
  }

  // Méthode séparée pour nettoyer les cookies
  private clearAuthData(): void {
    // Supprimer le token du cookie
    this.cookieService.deleteToken();

    // Mise à jour du BehaviorSubject
    this.currentUserSubject.next(null);

    // Redirection vers la page de login
    this.router.navigate(['/auth/login']);
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    const token = this.cookieService.getToken();
    return !!token;
  }

  getToken(): string | null {
    return this.cookieService.getToken();
  }

  // Décoder le JWT pour récupérer les informations minimales (sans appel API)
  getDecodedToken(): Record<string, unknown> | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = atob(payloadBase64);
      return JSON.parse(payloadJson);
    } catch {
      return null;
    }
  }

  // Récupère un identifiant utilisateur depuis le token (user_uuid | id | sub)
  getUserIdFromToken(): string | null {
    const payload = this.getDecodedToken();
    if (!payload) return null;
    const id = payload['user_uuid'] || payload['id'] || payload['sub'];
    return id ? String(id) : null;
  }

  logTokenToConsole(): void {
    this.getToken();
  }
}
