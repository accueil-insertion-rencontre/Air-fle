import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CookieService {
  constructor() {}

  /**
   * Définit un cookie avec des options de sécurité
   */
  set(
    name: string,
    value: string,
    options: {
      expires?: Date | number;
      maxAge?: number;
      path?: string;
      domain?: string;
      secure?: boolean;
      sameSite?: 'Strict' | 'Lax' | 'None';
      httpOnly?: boolean;
    } = {}
  ): void {
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (options.expires) {
      if (typeof options.expires === 'number') {
        const date = new Date();
        date.setTime(date.getTime() + options.expires * 24 * 60 * 60 * 1000);
        cookieString += `; expires=${date.toUTCString()}`;
      } else {
        cookieString += `; expires=${options.expires.toUTCString()}`;
      }
    }

    if (options.maxAge) {
      cookieString += `; max-age=${options.maxAge}`;
    }

    if (options.path) {
      cookieString += `; path=${options.path}`;
    }

    if (options.domain) {
      cookieString += `; domain=${options.domain}`;
    }

    if (options.secure) {
      cookieString += `; secure`;
    }

    if (options.sameSite) {
      cookieString += `; samesite=${options.sameSite}`;
    }

    // Note: httpOnly ne peut pas être défini depuis JavaScript côté client
    // Il doit être défini côté serveur
    if (options.httpOnly) {
      console.warn(
        'httpOnly ne peut pas être défini depuis JavaScript. Cette option doit être configurée côté serveur.'
      );
    }

    document.cookie = cookieString;
  }

  /**
   * Récupère la valeur d'un cookie
   */
  get(name: string): string | null {
    const nameEQ = encodeURIComponent(name) + '=';
    const ca = document.cookie.split(';');

    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
    return null;
  }

  /**
   * Supprime un cookie
   */
  delete(name: string, path: string = '/', domain?: string): void {
    const options: any = {
      expires: new Date(0),
      path: path,
    };

    if (domain) {
      options.domain = domain;
    }

    this.set(name, '', options);
  }

  /**
   * Vérifie si un cookie existe
   */
  exists(name: string): boolean {
    return this.get(name) !== null;
  }

  /**
   * Récupère tous les cookies
   */
  getAll(): { [key: string]: string } {
    const cookies: { [key: string]: string } = {};
    const ca = document.cookie.split(';');

    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      const eqPos = c.indexOf('=');
      if (eqPos > 0) {
        const name = decodeURIComponent(c.substring(0, eqPos));
        const value = decodeURIComponent(c.substring(eqPos + 1));
        cookies[name] = value;
      }
    }
    return cookies;
  }

  /**
   * Définit le token JWT avec des options de sécurité maximales
   */
  setSecureToken(token: string): void {
    this.set('access_token', token, {
      secure: window.location.protocol === 'https:',
      sameSite: 'Strict',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 heures en secondes
    });
  }

  /**
   * Récupère le token JWT
   */
  getToken(): string | null {
    return this.get('access_token');
  }

  /**
   * Supprime le token JWT
   */
  deleteToken(): void {
    this.delete('access_token');
  }
}
