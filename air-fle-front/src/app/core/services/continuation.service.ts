import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '@environments/environment';

import { 
  Continuation, 
  CreateContinuationDto, 
  UpdateContinuationDto,
  ContinuationListResponse,
  ContinuationFilters,
  ContinuationStats
} from '@core/models/continuation.model';

@Injectable({
  providedIn: 'root'
})
export class ContinuationService {
  private readonly apiUrl = `${environment.apiUrl}/continuation`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère toutes les continuations avec filtres optionnels
   */
  getAllContinuations(filters?: ContinuationFilters): Observable<Continuation[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.student_uuid) {
        params = params.set('student_uuid', filters.student_uuid);
      }
      if (filters.student_name) {
        params = params.set('student_name', filters.student_name);
      }
      if (filters.date_from) {
        params = params.set('date_from', filters.date_from);
      }
      if (filters.date_to) {
        params = params.set('date_to', filters.date_to);
      }
    }

    return this.http.get<Continuation[]>(this.apiUrl, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère une continuation par son ID
   */
  getContinuationById(continuationId: string): Observable<Continuation> {
    return this.http.get<Continuation>(`${this.apiUrl}/${continuationId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Crée une nouvelle continuation
   */
  createContinuation(continuationData: CreateContinuationDto): Observable<Continuation> {
    return this.http.post<Continuation>(this.apiUrl, continuationData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Met à jour une continuation
   */
  updateContinuation(continuationId: string, updateData: UpdateContinuationDto): Observable<Continuation> {
    return this.http.patch<Continuation>(`${this.apiUrl}/${continuationId}`, updateData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Supprime une continuation
   */
  deleteContinuation(continuationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${continuationId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère les statistiques des continuations
   */
  getContinuationStats(): Observable<ContinuationStats> {
    return this.http.get<ContinuationStats>(`${this.apiUrl}/stats`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère les continuations d'un étudiant spécifique
   */
  getContinuationsByStudent(studentId: string): Observable<Continuation[]> {
    return this.http.get<Continuation[]>(`${this.apiUrl}/student/${studentId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Gestion centralisée des erreurs
   */
  private handleError = (error: any) => {
    console.error('Erreur ContinuationService:', error);
    
    let errorMessage = 'Une erreur inattendue s\'est produite';
    
    if (error.error) {
      if (error.error.message) {
        errorMessage = error.error.message;
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  };
} 