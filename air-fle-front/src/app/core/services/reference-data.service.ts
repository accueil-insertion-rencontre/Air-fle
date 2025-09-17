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

// Interfaces pour les réponses du backend
interface NationalityResponse {
  nationality_uuid: string;
  nationality_label: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FrenchLevelResponse {
  french_level_uuid: string;
  french_level_code: string;
  french_level_description: string;
  createdAt?: string;
  updatedAt?: string;
}

interface GenderResponse {
  gender_uuid: string;
  gender_label: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ExitReasonResponse {
  exit_reason_uuid: string;
  exit_reason: string;
  createdAt?: string;
  updatedAt?: string;
}

interface OrientationResponse {
  orientation_uuid: string;
  orientation_type: string;
  orientation_description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface StatusResponse {
  status_uuid: string;
  status_label: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FinancingResponse {
  financing_uuid: string;
  financing_type: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DisabilityResponse {
  disability_uuid: string;
  disability_label: string;
  disability_description?: string;
  createdAt?: string;
  updatedAt?: string;
}

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

  // Méthodes de mapping pour transformer les réponses backend
  private mapNationality(data: NationalityResponse): Nationality {
    return {
      id: data.nationality_uuid,
      label: data.nationality_label,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  private mapFrenchLevel(data: FrenchLevelResponse): FrenchLevel {
    return {
      id: data.french_level_uuid,
      code: data.french_level_code,
      description: data.french_level_description,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  private mapStatus(data: StatusResponse): Status {
    return {
      id: data.status_uuid,
      label: data.status_label,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  private mapOrientation(data: OrientationResponse): Orientation {
    return {
      id: data.orientation_uuid,
      type: data.orientation_type,
      description: data.orientation_description,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  private mapExitReason(data: ExitReasonResponse): ExitReason {
    return {
      id: data.exit_reason_uuid,
      reason: data.exit_reason,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  private mapFinancing(data: FinancingResponse): Financing {
    return {
      id: data.financing_uuid,
      type: data.financing_type,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  private mapDisability(data: DisabilityResponse): Disability {
    return {
      id: data.disability_uuid,
      label: data.disability_label,
      description: data.disability_description,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

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
  private extractData<T>(response: ApiListResponse<T> | T[] | {data: T[]; success: boolean} | {data: {data: T[]}}): T[] {
    if ('data' in response && Array.isArray(response.data)) return response.data as T[];
    if ('success' in response && response.success && 'data' in response && Array.isArray(response.data)) return response.data as T[];
    if (Array.isArray(response)) return response as T[];
    return [] as T[];
  }

  // ===================
  // NATIONALITÉS
  // ===================
  getNationalities(): Observable<Nationality[]> {
    return this.http
      .get<ApiResponse<unknown[]> | {data: unknown[]}>(`${this.apiUrl}/nationalities`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map(response => {
          const data = this.extractData(response);
          return data.map(
            (item) =>
              ({
                id: (item as Record<string, unknown>)['nationality_uuid'],
                label: (item as Record<string, unknown>)['nationality_label'],
                createdAt: (item as Record<string, unknown>)['createdAt'],
                updatedAt: (item as Record<string, unknown>)['updatedAt'],
              }) as Nationality
          );
        }),
        catchError(err => {
          // console.error('Erreur lors du chargement des nationalités:', err);
          return of([]);
        })
      );
  }

  createNationality(data: CreateNationalityDto): Observable<Nationality> {
    return this.http
      .post<NationalityResponse | ApiResponse<NationalityResponse>>(`${this.apiUrl}/nationalities`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => {
        const nationalityData = 'data' in response && response.data ? response.data : response as NationalityResponse;
        return this.mapNationality(nationalityData);
      }));
  }

  updateNationality(id: string, data: CreateNationalityDto): Observable<Nationality> {
    return this.http
      .patch<NationalityResponse | ApiResponse<NationalityResponse>>(`${this.apiUrl}/nationalities/${id}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => {
        const nationalityData = 'data' in response && response.data ? response.data : response as NationalityResponse;
        return this.mapNationality(nationalityData);
      }));
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
      .get<ApiResponse<unknown[]> | {data: unknown[]}>(`${this.apiUrl}/french-levels`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map(response => {
          const data = this.extractData(response);
          return data.map(
            (item) =>
              ({
                id: (item as Record<string, unknown>)['french_level_uuid'],
                code: (item as Record<string, unknown>)['french_level_code'],
                description: (item as Record<string, unknown>)['french_level_description'],
                createdAt: (item as Record<string, unknown>)['createdAt'],
                updatedAt: (item as Record<string, unknown>)['updatedAt'],
              }) as FrenchLevel
          );
        }),
        catchError(err => {
          // console.error('Erreur lors du chargement des niveaux de français:', err);
          return of([]);
        })
      );
  }

  createFrenchLevel(data: CreateFrenchLevelDto): Observable<FrenchLevel> {
    return this.http
      .post<FrenchLevelResponse | ApiResponse<FrenchLevelResponse>>(`${this.apiUrl}/french-levels`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => {
        const levelData = 'data' in response && response.data ? response.data : response as FrenchLevelResponse;
        return this.mapFrenchLevel(levelData);
      }));
  }

  updateFrenchLevel(id: string, data: CreateFrenchLevelDto): Observable<FrenchLevel> {
    return this.http
      .patch<FrenchLevelResponse | ApiResponse<FrenchLevelResponse>>(`${this.apiUrl}/french-levels/${id}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => {
        const levelData = 'data' in response && response.data ? response.data : response as FrenchLevelResponse;
        return this.mapFrenchLevel(levelData);
      }));
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
      .get<ApiResponse<unknown[]> | {data: unknown[]}>(`${this.apiUrl}/genders`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map(response => {
          const data = this.extractData(response);
          return data.map(
            (item) =>
              ({
                id: (item as Record<string, unknown>)['gender_uuid'],
                label: (item as Record<string, unknown>)['gender_label'],
                createdAt: (item as Record<string, unknown>)['createdAt'],
                updatedAt: (item as Record<string, unknown>)['updatedAt'],
              }) as Gender
          );
        }),
        catchError(err => {
          // console.error('Erreur lors du chargement des genres:', err);
          return of([]);
        })
      );
  }

  createGender(data: CreateGenderDto): Observable<Gender> {
    return this.http
      .post<GenderResponse | ApiResponse<GenderResponse>>(`${this.apiUrl}/genders`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => {
        const genderData = 'data' in response && response.data ? response.data : response as GenderResponse;
        return {
          id: genderData.gender_uuid,
          label: genderData.gender_label,
          createdAt: genderData.createdAt,
          updatedAt: genderData.updatedAt,
        } as Gender;
      }));
  }

  updateGender(id: string, data: CreateGenderDto): Observable<Gender> {
    return this.http
      .patch<GenderResponse | ApiResponse<GenderResponse>>(`${this.apiUrl}/genders/${id}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => {
        const genderData = 'data' in response && response.data ? response.data : response as GenderResponse;
        return {
          id: genderData.gender_uuid,
          label: genderData.gender_label,
          createdAt: genderData.createdAt,
          updatedAt: genderData.updatedAt,
        } as Gender;
      }));
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
      .get<ApiResponse<unknown[]> | {data: unknown[]}>(`${this.apiUrl}/exit-reasons`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map(response => {
          const data = this.extractData(response);
          return data.map(
            (item) =>
              ({
                id: (item as Record<string, unknown>)['exit_reason_uuid'],
                reason: (item as Record<string, unknown>)['exit_reason'],
                createdAt: (item as Record<string, unknown>)['createdAt'],
                updatedAt: (item as Record<string, unknown>)['updatedAt'],
              }) as ExitReason
          );
        }),
        catchError(err => {
          // console.error('Erreur lors du chargement des raisons de sortie:', err);
          return of([]);
        })
      );
  }

  createExitReason(data: CreateExitReasonDto): Observable<ExitReason> {
    return this.http
      .post<ExitReasonResponse | ApiResponse<ExitReasonResponse>>(`${this.apiUrl}/exit-reasons`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => {
        const exitReasonData = 'data' in response && response.data ? response.data : response as ExitReasonResponse;
        return this.mapExitReason(exitReasonData);
      }));
  }

  updateExitReason(id: string, data: CreateExitReasonDto): Observable<ExitReason> {
    return this.http
      .patch<ExitReasonResponse | ApiResponse<ExitReasonResponse>>(`${this.apiUrl}/exit-reasons/${id}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => {
        const exitReasonData = 'data' in response && response.data ? response.data : response as ExitReasonResponse;
        return this.mapExitReason(exitReasonData);
      }));
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
      .get<ApiResponse<unknown[]> | {data: unknown[]}>(`${this.apiUrl}/orientations`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map(response => {
          const data = this.extractData(response);
          return data.map(
            (item) =>
              ({
                id: (item as Record<string, unknown>)['orientation_uuid'],
                type: (item as Record<string, unknown>)['orientation_type'],
                description: (item as Record<string, unknown>)['orientation_description'],
                createdAt: (item as Record<string, unknown>)['createdAt'],
                updatedAt: (item as Record<string, unknown>)['updatedAt'],
              }) as Orientation
          );
        }),
        catchError(err => {
          // console.error('Erreur lors du chargement des orientations:', err);
          return of([]);
        })
      );
  }

  createOrientation(data: CreateOrientationDto): Observable<Orientation> {
    return this.http
      .post<OrientationResponse | ApiResponse<OrientationResponse>>(`${this.apiUrl}/orientations`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => {
        const orientationData = 'data' in response && response.data ? response.data : response as OrientationResponse;
        return this.mapOrientation(orientationData);
      }));
  }

  updateOrientation(id: string, data: CreateOrientationDto): Observable<Orientation> {
    return this.http
      .patch<OrientationResponse | ApiResponse<OrientationResponse>>(`${this.apiUrl}/orientations/${id}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => {
        const orientationData = 'data' in response && response.data ? response.data : response as OrientationResponse;
        return this.mapOrientation(orientationData);
      }));
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
      .get<ApiResponse<unknown[]> | {data: unknown[]}>(`${this.apiUrl}/statuses`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map(response => {
          const data = this.extractData(response);
          return data.map(
            (item) =>
              ({
                id: (item as Record<string, unknown>)['status_uuid'],
                label: (item as Record<string, unknown>)['status_label'],
                createdAt: (item as Record<string, unknown>)['createdAt'],
                updatedAt: (item as Record<string, unknown>)['updatedAt'],
              }) as Status
          );
        }),
        catchError(err => {
          // console.error('Erreur lors du chargement des statuts:', err);
          return of([]);
        })
      );
  }

  createStatus(data: CreateStatusDto): Observable<Status> {
    return this.http
      .post<StatusResponse | ApiResponse<StatusResponse>>(`${this.apiUrl}/statuses`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => {
        const statusData = 'data' in response && response.data ? response.data : response as StatusResponse;
        return this.mapStatus(statusData);
      }));
  }

  updateStatus(id: string, data: CreateStatusDto): Observable<Status> {
    return this.http
      .patch<StatusResponse | ApiResponse<StatusResponse>>(`${this.apiUrl}/statuses/${id}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => {
        const statusData = 'data' in response && response.data ? response.data : response as StatusResponse;
        return this.mapStatus(statusData);
      }));
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
      .get<ApiResponse<unknown[]> | {data: unknown[]}>(`${this.apiUrl}/financings`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map(response => {
          const data = this.extractData(response);
          return data.map(
            (item) =>
              ({
                id: (item as Record<string, unknown>)['financing_uuid'],
                type: (item as Record<string, unknown>)['financing_type'],
                createdAt: (item as Record<string, unknown>)['createdAt'],
                updatedAt: (item as Record<string, unknown>)['updatedAt'],
              }) as Financing
          );
        }),
        catchError(err => {
          // console.error('Erreur lors du chargement des financements:', err);
          return of([]);
        })
      );
  }

  createFinancing(data: CreateFinancingDto): Observable<Financing> {
    return this.http
      .post<FinancingResponse | ApiResponse<FinancingResponse>>(`${this.apiUrl}/financings`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => {
        const financingData = 'data' in response && response.data ? response.data : response as FinancingResponse;
        return this.mapFinancing(financingData);
      }));
  }

  updateFinancing(id: string, data: CreateFinancingDto): Observable<Financing> {
    return this.http
      .patch<FinancingResponse | ApiResponse<FinancingResponse>>(`${this.apiUrl}/financings/${id}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => {
        const financingData = 'data' in response && response.data ? response.data : response as FinancingResponse;
        return this.mapFinancing(financingData);
      }));
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
      .get<ApiResponse<unknown[]> | {data: unknown[]}>(`${this.apiUrl}/disabilities`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map(response => {
          const data = this.extractData(response);
          return data.map(
            (item) =>
              ({
                id: (item as Record<string, unknown>)['disability_uuid'],
                label: (item as Record<string, unknown>)['disability_label'],
                description: (item as Record<string, unknown>)['disability_description'],
                createdAt: (item as Record<string, unknown>)['createdAt'],
                updatedAt: (item as Record<string, unknown>)['updatedAt'],
              }) as Disability
          );
        }),
        catchError(err => {
          // console.error('Erreur lors du chargement des handicaps:', err);
          return of([]);
        })
      );
  }

  createDisability(data: CreateDisabilityDto): Observable<Disability> {
    return this.http
      .post<DisabilityResponse | ApiResponse<DisabilityResponse>>(`${this.apiUrl}/disabilities`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => {
        const disabilityData = 'data' in response && response.data ? response.data : response as DisabilityResponse;
        return this.mapDisability(disabilityData);
      }));
  }

  updateDisability(id: string, data: CreateDisabilityDto): Observable<Disability> {
    return this.http
      .patch<DisabilityResponse | ApiResponse<DisabilityResponse>>(`${this.apiUrl}/disabilities/${id}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(map(response => {
        const disabilityData = 'data' in response && response.data ? response.data : response as DisabilityResponse;
        return this.mapDisability(disabilityData);
      }));
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