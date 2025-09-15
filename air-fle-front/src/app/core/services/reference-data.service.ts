import { environment } from '@environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiListResponse } from '../models';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import {
  Nationality,
  FrenchLevel,
  Gender,
  ExitReason,
  Orientation,
  Status,
  Financing,
  Disability,
  CreateNationalityDto,
  CreateFrenchLevelDto,
  CreateGenderDto,
  CreateExitReasonDto,
  CreateOrientationDto,
  CreateStatusDto,
  CreateFinancingDto,
  CreateDisabilityDto,
  ApiResponse,
} from '../models/reference-data.model';

export interface ReferenceData {
  genders: Gender[];
  nationalities: Nationality[];
  frenchLevels: FrenchLevel[];
  financings: Financing[];
  statuses: Status[];
  orientations: Orientation[];
  exitReasons: ExitReason[];
  disabilities: Disability[];
}

// Réexport des types pour faciliter l'import
export type {
  Gender,
  Nationality,
  FrenchLevel,
  Financing,
  Status,
  Orientation,
  ExitReason,
  Disability,
  CreateNationalityDto,
  CreateFrenchLevelDto,
  CreateGenderDto,
  CreateExitReasonDto,
  CreateOrientationDto,
  CreateStatusDto,
  CreateFinancingDto,
  CreateDisabilityDto
} from '../models/reference-data.model';

@Injectable({
  providedIn: 'root',
})
export class ReferenceDataService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  /**
   * Méthode utilitaire pour extraire les données de la réponse API
   */
  private extractData<T>(response: ApiListResponse<T> | any): T[] {
    if (response && Array.isArray(response.data)) return response.data as T[];
    if (response && response.success && response.data && Array.isArray(response.data)) return response.data as T[];
    if (Array.isArray(response)) return response as T[];
    return [] as T[];
  }

  // ===================
  // NATIONALITÉS
  // ===================
  getNationalities(): Observable<Nationality[]> {
    return this.http
      .get<ApiResponse<any[]>>(`${this.apiUrl}/nationalities`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map(response => {
          const data = this.extractData<any>(response);
          return data.map(
            (item: any) =>
              ({
                id: item.nationality_uuid,
                label: item.nationality_label,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
              }) as Nationality
          );
        }),
        catchError(err => {
          console.error('Erreur lors du chargement des nationalités:', err);
          return of([]);
        })
      );
  }

  createNationality(data: CreateNationalityDto): Observable<Nationality> {
    return this.http
      .post<ApiResponse<Nationality>>(`${this.apiUrl}/nationalities`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => response.data));
  }

  updateNationality(id: string, data: CreateNationalityDto): Observable<Nationality> {
    return this.http
      .put<ApiResponse<Nationality>>(`${this.apiUrl}/nationalities/${id}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => response.data));
  }

  deleteNationality(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/nationalities/${id}`, {
        headers: this.getHeaders(),
      })
      .pipe(map(() => void 0));
  }

  // ===================
  // NIVEAUX DE FRANÇAIS
  // ===================
  getFrenchLevels(): Observable<FrenchLevel[]> {
    return this.http
      .get<ApiResponse<any[]>>(`${this.apiUrl}/french-levels`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map(response => {
          const data = this.extractData<any>(response);
          return data.map(
            (item: any) =>
              ({
                id: item.french_level_uuid,
                code: item.french_level_code,
                description: item.french_level_description,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
              }) as FrenchLevel
          );
        }),
        catchError(err => {
          console.error('Erreur lors du chargement des niveaux de français:', err);
          return of([]);
        })
      );
  }

  createFrenchLevel(data: CreateFrenchLevelDto): Observable<FrenchLevel> {
    return this.http
      .post<ApiResponse<FrenchLevel>>(`${this.apiUrl}/french-levels`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => response.data));
  }

  updateFrenchLevel(id: string, data: CreateFrenchLevelDto): Observable<FrenchLevel> {
    return this.http
      .put<ApiResponse<FrenchLevel>>(`${this.apiUrl}/french-levels/${id}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => response.data));
  }

  deleteFrenchLevel(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/french-levels/${id}`, {
        headers: this.getHeaders(),
      })
      .pipe(map(() => void 0));
  }

  // ===================
  // GENRES
  // ===================
  getGenders(): Observable<Gender[]> {
    return this.http
      .get<ApiResponse<any[]>>(`${this.apiUrl}/genders`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map(response => {
          const data = this.extractData<any>(response);
          return data.map(
            (item: any) =>
              ({
                id: item.gender_uuid,
                label: item.gender_label,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
              }) as Gender
          );
        }),
        catchError(err => {
          console.error('Erreur lors du chargement des genres:', err);
          return of([]);
        })
      );
  }

  createGender(data: CreateGenderDto): Observable<Gender> {
    return this.http
      .post<ApiResponse<Gender>>(`${this.apiUrl}/genders`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => response.data));
  }

  updateGender(id: string, data: CreateGenderDto): Observable<Gender> {
    return this.http
      .put<ApiResponse<Gender>>(`${this.apiUrl}/genders/${id}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => response.data));
  }

  deleteGender(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/genders/${id}`, {
        headers: this.getHeaders(),
      })
      .pipe(map(() => void 0));
  }

  // ===================
  // RAISONS DE SORTIE
  // ===================
  getExitReasons(): Observable<ExitReason[]> {
    return this.http
      .get<ApiResponse<any[]>>(`${this.apiUrl}/exit-reasons`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map(response => {
          const data = this.extractData<any>(response);
          return data.map(
            (item: any) =>
              ({
                id: item.exit_reason_uuid,
                reason: item.exit_reason,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
              }) as ExitReason
          );
        }),
        catchError(err => {
          console.error('Erreur lors du chargement des raisons de sortie:', err);
          return of([]);
        })
      );
  }

  createExitReason(data: CreateExitReasonDto): Observable<ExitReason> {
    return this.http
      .post<ApiResponse<ExitReason>>(`${this.apiUrl}/exit-reasons`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => response.data));
  }

  updateExitReason(id: string, data: CreateExitReasonDto): Observable<ExitReason> {
    return this.http
      .put<ApiResponse<ExitReason>>(`${this.apiUrl}/exit-reasons/${id}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => response.data));
  }

  deleteExitReason(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/exit-reasons/${id}`, {
        headers: this.getHeaders(),
      })
      .pipe(map(() => void 0));
  }

  // ===================
  // ORIENTATIONS
  // ===================
  getOrientations(): Observable<Orientation[]> {
    return this.http
      .get<ApiResponse<any[]>>(`${this.apiUrl}/orientations`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map(response => {
          const data = this.extractData<any>(response);
          return data.map(
            (item: any) =>
              ({
                id: item.orientation_uuid,
                type: item.orientation_type,
                description: item.orientation_description,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
              }) as Orientation
          );
        }),
        catchError(err => {
          console.error('Erreur lors du chargement des orientations:', err);
          return of([]);
        })
      );
  }

  createOrientation(data: CreateOrientationDto): Observable<Orientation> {
    return this.http
      .post<ApiResponse<Orientation>>(`${this.apiUrl}/orientations`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => response.data));
  }

  updateOrientation(id: string, data: CreateOrientationDto): Observable<Orientation> {
    return this.http
      .put<ApiResponse<Orientation>>(`${this.apiUrl}/orientations/${id}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => response.data));
  }

  deleteOrientation(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/orientations/${id}`, {
        headers: this.getHeaders(),
      })
      .pipe(map(() => void 0));
  }

  // ===================
  // STATUTS
  // ===================
  getStatuses(): Observable<Status[]> {
    return this.http
      .get<ApiResponse<any[]>>(`${this.apiUrl}/statuses`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map(response => {
          const data = this.extractData<any>(response);
          return data.map(
            (item: any) =>
              ({
                id: item.status_uuid,
                label: item.status_label,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
              }) as Status
          );
        }),
        catchError(err => {
          console.error('Erreur lors du chargement des statuts:', err);
          return of([]);
        })
      );
  }

  createStatus(data: CreateStatusDto): Observable<Status> {
    return this.http
      .post<ApiResponse<Status>>(`${this.apiUrl}/statuses`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => response.data));
  }

  updateStatus(id: string, data: CreateStatusDto): Observable<Status> {
    return this.http
      .put<ApiResponse<Status>>(`${this.apiUrl}/statuses/${id}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => response.data));
  }

  deleteStatus(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/statuses/${id}`, {
        headers: this.getHeaders(),
      })
      .pipe(map(() => void 0));
  }

  // ===================
  // FINANCEMENTS
  // ===================
  getFinancings(): Observable<Financing[]> {
    return this.http
      .get<ApiResponse<any[]>>(`${this.apiUrl}/financings`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map(response => {
          const data = this.extractData<any>(response);
          return data.map(
            (item: any) =>
              ({
                id: item.financing_uuid,
                type: item.financing_type,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
              }) as Financing
          );
        }),
        catchError(err => {
          console.error('Erreur lors du chargement des financements:', err);
          return of([]);
        })
      );
  }

  createFinancing(data: CreateFinancingDto): Observable<Financing> {
    return this.http
      .post<ApiResponse<Financing>>(`${this.apiUrl}/financings`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => response.data));
  }

  updateFinancing(id: string, data: CreateFinancingDto): Observable<Financing> {
    return this.http
      .put<ApiResponse<Financing>>(`${this.apiUrl}/financings/${id}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => response.data));
  }

  deleteFinancing(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/financings/${id}`, {
        headers: this.getHeaders(),
      })
      .pipe(map(() => void 0));
  }

  // ===================
  // HANDICAPS
  // ===================
  getDisabilities(): Observable<Disability[]> {
    return this.http
      .get<ApiResponse<any[]>>(`${this.apiUrl}/disabilities`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map(response => {
          const data = this.extractData<any>(response);
          return data.map(
            (item: any) =>
              ({
                id: item.disability_uuid,
                label: item.disability_label,
                description: item.disability_description,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
              }) as Disability
          );
        }),
        catchError(err => {
          console.error('Erreur lors du chargement des handicaps:', err);
          return of([]);
        })
      );
  }

  createDisability(data: CreateDisabilityDto): Observable<Disability> {
    return this.http
      .post<ApiResponse<Disability>>(`${this.apiUrl}/disabilities`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => response.data));
  }

  updateDisability(id: string, data: CreateDisabilityDto): Observable<Disability> {
    return this.http
      .put<ApiResponse<Disability>>(`${this.apiUrl}/disabilities/${id}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => response.data));
  }

  deleteDisability(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/disabilities/${id}`, {
        headers: this.getHeaders(),
      })
      .pipe(map(() => void 0));
  }

  // ===================
  // MÉTHODES UTILITAIRES
  // ===================

  /**
   * Récupère toutes les données de référence en une seule fois
   */
  getAllReferenceData(): Observable<ReferenceData> {
    return forkJoin({
      genders: this.getGenders(),
      nationalities: this.getNationalities(),
      frenchLevels: this.getFrenchLevels(),
      financings: this.getFinancings(),
      statuses: this.getStatuses(),
      orientations: this.getOrientations(),
      exitReasons: this.getExitReasons(),
      disabilities: this.getDisabilities(),
    });
  }

  /**
   * Récupère seulement les données obligatoires
   */
  getRequiredReferenceData(): Observable<Partial<ReferenceData>> {
    return forkJoin({
      genders: this.getGenders(),
      nationalities: this.getNationalities(),
      frenchLevels: this.getFrenchLevels(),
      financings: this.getFinancings(),
      statuses: this.getStatuses(),
    });
  }
} 