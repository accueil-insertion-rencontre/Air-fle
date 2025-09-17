import { environment } from '@environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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
    return this.http.get<Record<string, unknown>>(this.apiUrl).pipe(
      // Vérifier et adapter le format de la réponse
      map((response: ApiListResponse<Session> | Record<string, unknown>) => {
        // Structure spécifique de votre API: response.data.data contient le tableau
        if (response && response['data'] && (response['data'] as Record<string, unknown>)['data'] && Array.isArray((response['data'] as Record<string, unknown>)['data'])) {
          return ((response['data'] as Record<string, unknown>)['data'] as Record<string, unknown>[]).map((session: Record<string, unknown>) => this.convertToFrontendModel(session));
        }
        if (response && Array.isArray(response['data'])) {
          return (response['data'] as Record<string, unknown>[]).map(s => this.convertToFrontendModel(s));
        }
        // Vérifier si la réponse est un tableau
        else if (Array.isArray(response)) {
          return response.map((session: Record<string, unknown>) => this.convertToFrontendModel(session));
        }
        // Vérifier si la réponse est un objet avec une propriété data ou items
        else if (response && ((response as Record<string, unknown>)['data'] || (response as Record<string, unknown>)['items'])) {
          const sessionsData = (response as Record<string, unknown>)['data'] || (response as Record<string, unknown>)['items'];
          if (Array.isArray(sessionsData)) {
            return (sessionsData as Record<string, unknown>[]).map((session: Record<string, unknown>) => this.convertToFrontendModel(session));
          }
        }
        // Si c'est un objet unique, le mettre dans un tableau
        else if (response && ((response as Record<string, unknown>)['id'] || (response as Record<string, unknown>)['session_id'])) {
          return [this.convertToFrontendModel(response as Record<string, unknown>)];
        }

        return [];
      }),
      catchError(this.handleError)
    );
  }

  getSessionById(id: number): Observable<Session> {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        // Structure spécifique de votre API: response.data contient l'objet session
        if (response && response['data']) {
          return this.convertToFrontendModel(response['data'] as Record<string, unknown>);
        }
        // Si la structure est différente, essayer de convertir directement
        else if (response && (response['id'] || response['session_id'])) {
          return this.convertToFrontendModel(response);
        }

        throw new Error('Format de réponse API inattendu');
      }),
      catchError(this.handleError)
    );
  }

  createSession(session: Partial<Session>): Observable<Session> {
    const apiSession = this.convertToApiModel(session);
    return this.http.post<Session>(this.apiUrl, apiSession).pipe(
      map(session => this.convertToFrontendModel(session as unknown as Record<string, unknown>)),
      catchError(this.handleError)
    );
  }

  updateSession(id: number | string, session: Partial<Session>): Observable<Session> {
    const apiSession = this.convertToApiModel(session);
    return this.http.patch<Record<string, unknown>>(`${this.apiUrl}/${id}`, apiSession).pipe(
      map(response => {
        // Structure spécifique de votre API: response.data contient l'objet session
        if (response && response['data']) {
          return this.convertToFrontendModel(response['data'] as Record<string, unknown>);
        }
        // Si la structure est différente, essayer de convertir directement
        else if (response && (response['id'] || response['session_id'])) {
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



  private handleError(error: Error): Observable<never> {
    return throwError(() => error);
  }

  // Convertir un modèle de session de l'API vers le format frontend
  private convertToFrontendModel(apiSession: Record<string, unknown>): Session {
    if (!apiSession) {
      return {} as Session;
    }

    const sessionUuid = apiSession['session_uuid'] || apiSession['id'];

    // Traiter les groupes s'ils sont présents
    let groups: Record<string, unknown>[] = [];
    if (apiSession['groups'] && Array.isArray(apiSession['groups'])) {
      groups = (apiSession['groups'] as Record<string, unknown>[]).map((group) => ({
        group_uuid: group['group_uuid'] || group['id'],
        group_label: group['group_label'] || group['label'],
        session_uuid: group['session_uuid'] || sessionUuid,
        students: group['students'] || [],
      }));
    }

    return {
      // ✅ NOUVEAUX CHAMPS (schéma réel)
      session_uuid: sessionUuid as string,
      session_label: apiSession['session_label'] as string,
      session_started_at: apiSession['session_started_at'] as string | Date,
      session_finished_at: apiSession['session_finished_at'] as string | Date,
      session_created_at: apiSession['session_created_at'] as string | Date,
      session_description: apiSession['session_description'] as string,
      
      // Relations
      groups: groups,
      
      // ✅ PROPRIÉTÉS DE COMPATIBILITÉ TEMPORAIRES
      id: sessionUuid as string, // Alias
      label: apiSession['session_label'] as string, // Alias
      startedAt: apiSession['session_started_at'] as string, // Alias
      finishedAt: apiSession['session_finished_at'] as string, // Alias
      started_at: apiSession['session_started_at'] as string | Date, // Alias
      finished_at: apiSession['session_finished_at'] as string | Date, // Alias
    };
  }

  // Convertir un modèle de session du frontend vers le format API
  private convertToApiModel(session: Partial<Session>): Record<string, unknown> {
    // ✅ NOUVEAUX CHAMPS - Utiliser les vrais noms de la base de données
    const apiSession: Record<string, unknown> = {
      session_label: session.session_label || session.label,
    };

    // Traiter les dates pour s'assurer qu'elles sont au format ISO 8601
    if (session.session_started_at || session.startedAt || session.started_at) {
      const startedAt = session.session_started_at || session.startedAt || session.started_at;
      apiSession['session_started_at'] = this.formatDateToISO(startedAt!);
    }

    if (session.session_finished_at || session.finishedAt || session.finished_at) {
      const finishedAt = session.session_finished_at || session.finishedAt || session.finished_at;
      apiSession['session_finished_at'] = this.formatDateToISO(finishedAt!);
    }

    // Ajouter la description si elle existe
    if (session.session_description) {
      apiSession['session_description'] = session.session_description;
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
  getSessionGroups(sessionId: number): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.apiUrl}/${sessionId}/groups`);
  }
}
