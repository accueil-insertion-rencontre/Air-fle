import { environment } from '@environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Session } from '../models/session.model';
import { ApiListResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private apiUrl = `${environment.apiUrl}/sessions`;

  // Données mock temporaires


  constructor(private http: HttpClient) {}

  getSessions(): Observable<Session[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      // Vérifier et adapter le format de la réponse
      map((response: ApiListResponse<Session> | any) => {
        // Structure spécifique de votre API: response.data.data contient le tableau
        if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
          return response.data.data.map((session: any) => this.convertToFrontendModel(session));
        }
        if (response && Array.isArray(response.data)) {
          return (response.data as any[]).map(s => this.convertToFrontendModel(s));
        }
        // Vérifier si la réponse est un tableau
        else if (Array.isArray(response)) {
          return response.map((session: any) => this.convertToFrontendModel(session));
        }
        // Vérifier si la réponse est un objet avec une propriété data ou items
        else if (response && (response.data || response.items)) {
          const sessionsData = response.data || response.items;
          if (Array.isArray(sessionsData)) {
            return sessionsData.map((session: any) => this.convertToFrontendModel(session));
          }
        }
        // Si c'est un objet unique, le mettre dans un tableau
        else if (response && (response.id || response.session_id)) {
          return [this.convertToFrontendModel(response)];
        }

        return [];
      }),
      catchError(this.handleError)
    );
  }

  getSessionById(id: number): Observable<Session> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        // Structure spécifique de votre API: response.data contient l'objet session
        if (response && response.data) {
          return this.convertToFrontendModel(response.data);
        }
        // Si la structure est différente, essayer de convertir directement
        else if (response && (response.id || response.session_id)) {
          return this.convertToFrontendModel(response);
        }

        throw new Error('Format de réponse API inattendu');
      }),
      catchError(this.handleError)
    );
  }

  createSession(session: any): Observable<Session> {
    const apiSession = this.convertToApiModel(session);
    return this.http.post<Session>(this.apiUrl, apiSession).pipe(
      map(session => this.convertToFrontendModel(session)),
      catchError(this.handleError)
    );
  }

  updateSession(id: number | string, session: Partial<Session>): Observable<Session> {
    const apiSession = this.convertToApiModel(session);
    return this.http.patch<any>(`${this.apiUrl}/${id}`, apiSession).pipe(
      map(response => {
        // Structure spécifique de votre API: response.data contient l'objet session
        if (response && response.data) {
          return this.convertToFrontendModel(response.data);
        }
        // Si la structure est différente, essayer de convertir directement
        else if (response && (response.id || response.session_id)) {
          return this.convertToFrontendModel(response);
        }

        throw new Error('Format de réponse API inattendu');
      }),
      catchError(this.handleError)
    );
  }

  deleteSession(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }



  private handleError(error: any): Observable<never> {
    return throwError(() => error);
  }

  // Convertir un modèle de session de l'API vers le format frontend
  private convertToFrontendModel(apiSession: any): Session {
    if (!apiSession) {
      return {} as Session;
    }

    const sessionUuid = apiSession.session_uuid || apiSession.id;

    // Traiter les groupes s'ils sont présents
    let groups = [];
    if (apiSession.groups && Array.isArray(apiSession.groups)) {
      groups = apiSession.groups.map((group: any) => ({
        group_uuid: group.group_uuid || group.id,
        group_label: group.group_label || group.label,
        session_uuid: group.session_uuid || sessionUuid,
        students: group.students || [],
      }));
    }

    return {
      // ✅ NOUVEAUX CHAMPS (schéma réel)
      session_uuid: sessionUuid,
      session_label: apiSession.session_label,
      session_started_at: apiSession.session_started_at,
      session_finished_at: apiSession.session_finished_at,
      session_created_at: apiSession.session_created_at,
      session_description: apiSession.session_description,
      
      // Relations
      groups: groups,
      
      // ✅ PROPRIÉTÉS DE COMPATIBILITÉ TEMPORAIRES
      id: sessionUuid, // Alias
      label: apiSession.session_label, // Alias
      startedAt: apiSession.session_started_at, // Alias
      finishedAt: apiSession.session_finished_at, // Alias
      started_at: apiSession.session_started_at, // Alias
      finished_at: apiSession.session_finished_at, // Alias
    };
  }

  // Convertir un modèle de session du frontend vers le format API
  private convertToApiModel(session: any): any {
    // ✅ NOUVEAUX CHAMPS - Utiliser les vrais noms de la base de données
    const apiSession: any = {
      session_label: session.session_label || session.label,
    };

    // Traiter les dates pour s'assurer qu'elles sont au format ISO 8601
    if (session.session_started_at || session.startedAt || session.started_at) {
      const startedAt = session.session_started_at || session.startedAt || session.started_at;
      apiSession.session_started_at = this.formatDateToISO(startedAt);
    }

    if (session.session_finished_at || session.finishedAt || session.finished_at) {
      const finishedAt = session.session_finished_at || session.finishedAt || session.finished_at;
      apiSession.session_finished_at = this.formatDateToISO(finishedAt);
    }

    // Ajouter la description si elle existe
    if (session.session_description) {
      apiSession.session_description = session.session_description;
    }

    return apiSession;
  }

  // Formater une date au format ISO 8601 string
  private formatDateToISO(date: string | Date): string {
    if (!date) return '';

    let dateObj: Date;

    if (typeof date === 'string') {
      // Essayer de convertir la chaîne en date
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }

    // Vérifier si la date est valide
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    // Formater au format ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
    return dateObj.toISOString();
  }

  // Récupérer les sessions pour une période donnée
  getSessionsByDateRange(start: Date, end: Date): Observable<Session[]> {
    return this.http.get<Session[]>(
      `${this.apiUrl}/range?start=${start.toISOString()}&end=${end.toISOString()}`
    );
  }

  // Récupérer les groupes d'une session
  getSessionGroups(sessionId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${sessionId}/groups`);
  }
}
