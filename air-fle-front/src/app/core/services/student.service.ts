import { environment } from '@environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Student, CreateStudentRequest, StudentListResponse, StudentListConfig, ApiListResponse, Paginated } from '../models';

export interface StudentSearchResult {
  students: Student[];
  total: number;
}

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private readonly apiUrl = `${environment.apiUrl}/students`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les étudiants (pour sélection dans les groupes)
   */
  getAllStudents(): Observable<Student[]> {
    return this.http.get<ApiListResponse<Student> | Student[]>(this.apiUrl).pipe(
      map((response) => {
        if (response && 'data' in response && Array.isArray(response.data)) return response.data;
        if (response && 'data' in response && response.data && 'students' in response.data && Array.isArray((response.data as unknown as Record<string, unknown>)['students'])) return (response.data as unknown as Record<string, unknown>)['students'] as Student[];
        if (Array.isArray(response)) return response;
        return [];
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Recherche des étudiants par nom/prénom
   */
  searchStudents(query: string): Observable<Student[]> {
    let params = new HttpParams();

    if (query.trim()) {
      // Si la requête contient un espace, on divise en prénom et nom
      const parts = query.trim().split(' ');
      if (parts.length >= 2) {
        params = params.set('firstname', parts[0]);
        params = params.set('lastname', parts.slice(1).join(' '));
      } else {
        // Recherche dans les deux champs
        params = params.set('search', query);
      }
    }

    return this.http.get<ApiListResponse<Student> | Student[]>(this.apiUrl, { params }).pipe(
      map((response) => {
        if (response && 'data' in response && Array.isArray(response.data)) return response.data;
        if (response && 'data' in response && response.data && 'students' in (response.data as unknown as Record<string, unknown>) && Array.isArray((response.data as unknown as Record<string, unknown>)['students'])) return (response.data as unknown as Record<string, unknown>)['students'] as Student[];
        if (Array.isArray(response)) return response;
        return [];
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Récupère un étudiant par son ID
   */
  getStudentById(id: string | number): Observable<Student> {
    return this.http.get<{ success?: boolean; data?: Student } | Student>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if ('success' in response && response.success && response.data) {
          return response.data;
        } else {
          return response as Student;
        }
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Récupère les étudiants avec pagination
   */
  getStudentsWithPagination(
    page: number = 1,
    pageSize: number = 10,
    search: string = ''
  ): Observable<StudentSearchResult> {
    let params = new HttpParams();

    const skip = (page - 1) * pageSize;
    params = params.set('skip', skip.toString());
    params = params.set('take', pageSize.toString());

    if (search.trim()) {
      params = params.set('search', search);
    }

    return this.http.get<Paginated<Student> | ApiListResponse<Student> | {data: {students: Student[]; total?: number}} | Student[]>(this.apiUrl, { params }).pipe(
      map((response) => {
        if (response && 'data' in response && Array.isArray(response.data) && 'meta' in response) {
          return { students: response.data as Student[], total: response.meta?.total ?? response.data.length };
        }
        if (response && 'data' in response && response.data && 'students' in response.data && Array.isArray((response.data as unknown as Record<string, unknown>)['students'])) {
          const data = response.data as Record<string, unknown>;
          return { students: data['students'] as Student[], total: (data['total'] ?? (data['students'] as Student[]).length) as number };
        }
        if (Array.isArray(response)) {
          return { students: response as Student[], total: (response as Student[]).length };
        }
        return { students: [], total: 0 };
      }),
      catchError(() => of({ students: [], total: 0 }))
    );
  }

  /**
   * Récupère le nombre total d'étudiants
   */
  getStudentCount(): Observable<number> {
    // Appeler l'API pour obtenir le vrai total d'étudiants
    const params = new HttpParams().set('skip', '0').set('take', '1');
    return this.http.get<{success: boolean; data: {total: number}} | Paginated<Student>>(this.apiUrl, { params }).pipe(
      map(response => {
        if ('success' in response && response.success && 'data' in response && response.data && typeof (response.data as Record<string, unknown>)['total'] === 'number') {
          return (response.data as Record<string, unknown>)['total'] as number;
        }
        return 0;
      }),
      catchError(() => of(0))
    );
  }

  /**
   * Crée un nouvel étudiant
   */
  createStudent(studentData: CreateStudentRequest): Observable<Student> {
    return this.http.post<Student>(this.apiUrl, studentData);
  }

  /**
   * Met à jour un étudiant existant
   */
  updateStudent(id: string, studentData: Partial<CreateStudentRequest>): Observable<Student> {
    return this.http.patch<Student>(`${this.apiUrl}/${id}`, studentData);
  }

  /**
   * Récupère les étudiants avec configuration (alias pour getAllStudents pour compatibilité)
   */
  getStudents(config?: StudentListConfig): Observable<StudentListResponse> {
    let params = new HttpParams();
    const skip = ((config?.page || 1) - 1) * (config?.pageSize || 20);
    const take = config?.pageSize || 20;

    params = params.set('skip', skip.toString());
    params = params.set('take', take.toString());

    if (config?.filters) {
      Object.entries(config.filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params = params.set(key, value);
        }
      });
    }
    // Ajout du tri si besoin
    if (config?.sort) {
      params = params.set('orderBy', JSON.stringify({ [config.sort.field]: config.sort.direction }));
    }
    return this.http.get<Paginated<Student> | ApiListResponse<Student> | {data: Student[]; meta?: {total?: number}}>(this.apiUrl, { params }).pipe(
      map((response) => {
        const page = config?.page || 1;
        const pageSize = config?.pageSize || 20;
        if (response && Array.isArray(response.data) && response.meta) {
          const total = response.meta.total ?? response.data.length;
          return {
            students: response.data as Student[],
            total,
            page: (response.meta as Record<string, unknown>)?.['page'] as number ?? page,
            pageSize: (response.meta as Record<string, unknown>)?.['pageSize'] as number ?? pageSize,
            totalPages: (response.meta as Record<string, unknown>)?.['totalPages'] as number ?? Math.ceil(total / pageSize),
          };
        }
        if (response && response.data && Array.isArray((response.data as unknown as Record<string, unknown>)['students'])) {
          const list = (response.data as unknown as Record<string, unknown>)['students'] as Student[];
          const total = ((response.data as unknown as Record<string, unknown>)['total'] as number) ?? list.length;
          return { students: list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
        }
        if (Array.isArray(response)) {
          const list = response as Student[];
          const total = list.length;
          return { students: list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
        }
        return { students: [], total: 0, page, pageSize, totalPages: 1 };
      }),
      catchError(() => of({ students: [], total: 0, page: 1, pageSize: 20, totalPages: 1 }))
    );
  }

  /**
   * Supprime un étudiant
   */
  deleteStudent(id: string): Observable<void> {
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
      }),
      catchError(error => {
        // console.error('❌ StudentService - Erreur suppression:', error);
        throw error;
      })
    );
  }

  /**
   * Associe des handicaps à un étudiant
   */
  assignDisabilities(studentId: string, disabilityIds: string[]): Observable<unknown> {
    const data = {
      disability_ids: disabilityIds,
    };
    return this.http.post(`${this.apiUrl}/${studentId}/disabilities`, data);
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError<T>(result?: T) {
    return (): Observable<T> => {
      return new Observable(observer => {
        observer.next(result as T);
        observer.complete();
      });
    };
  }
}
