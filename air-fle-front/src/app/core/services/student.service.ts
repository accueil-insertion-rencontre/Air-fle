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
    return this.http.get<any>(this.apiUrl).pipe(
      map((response: ApiListResponse<Student> | any) => {
        if (response && Array.isArray(response.data)) return response.data as Student[];
        if (response && response.data && Array.isArray(response.data.students)) return response.data.students as Student[];
        if (Array.isArray(response)) return response as Student[];
        return [];
      }),
      catchError(error => of([]))
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

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response: ApiListResponse<Student> | any) => {
        if (response && Array.isArray(response.data)) return response.data as Student[];
        if (response && response.data && Array.isArray(response.data.students)) return response.data.students as Student[];
        if (Array.isArray(response)) return response as Student[];
        return [];
      }),
      catchError(error => of([]))
    );
  }

  /**
   * Récupère un étudiant par son ID
   */
  getStudentById(id: string | number): Observable<Student> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          return response;
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

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response: Paginated<Student> | ApiListResponse<Student> | any) => {
        if (response && Array.isArray(response.data) && response.meta) {
          return { students: response.data as Student[], total: response.meta.total ?? response.data.length };
        }
        if (response && response.data && Array.isArray(response.data.students)) {
          return { students: response.data.students as Student[], total: response.data.total ?? (response.data.students as Student[]).length };
        }
        if (Array.isArray(response)) {
          return { students: response as Student[], total: (response as Student[]).length };
        }
        return { students: [], total: 0 };
      }),
      catchError(error => of({ students: [], total: 0 }))
    );
  }

  /**
   * Récupère le nombre total d'étudiants
   */
  getStudentCount(): Observable<number> {
    // Appeler l'API pour obtenir le vrai total d'étudiants
    const params = new HttpParams().set('skip', '0').set('take', '1');
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => {
        if (response.success && response.data && typeof response.data.total === 'number') {
          return response.data.total;
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
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response: Paginated<Student> | ApiListResponse<Student> | any) => {
        const page = config?.page || 1;
        const pageSize = config?.pageSize || 20;
        if (response && Array.isArray(response.data) && response.meta) {
          const total = response.meta.total ?? response.data.length;
          return {
            students: response.data as Student[],
            total,
            page: response.meta.page ?? page,
            pageSize: response.meta.pageSize ?? pageSize,
            totalPages: response.meta.totalPages ?? Math.ceil(total / pageSize),
          };
        }
        if (response && response.data && Array.isArray(response.data.students)) {
          const list = response.data.students as Student[];
          const total = response.data.total ?? list.length;
          return { students: list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
        }
        if (Array.isArray(response)) {
          const list = response as Student[];
          const total = list.length;
          return { students: list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
        }
        return { students: [], total: 0, page, pageSize, totalPages: 1 };
      }),
      catchError(error => of({ students: [], total: 0, page: 1, pageSize: 20, totalPages: 1 }))
    );
  }

  /**
   * Supprime un étudiant
   */
  deleteStudent(id: string): Observable<any> {
    console.log('🗑️ StudentService - URL de suppression:', `${this.apiUrl}/${id}`);
    console.log('🗑️ StudentService - ID à supprimer:', id);
    
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(response => {
        console.log('✅ StudentService - Suppression réussie:', response);
      }),
      catchError(error => {
        console.error('❌ StudentService - Erreur suppression:', error);
        throw error;
      })
    );
  }

  /**
   * Associe des handicaps à un étudiant
   */
  assignDisabilities(studentId: string, disabilityIds: string[]): Observable<any> {
    const data = {
      disability_ids: disabilityIds,
    };
    return this.http.post(`${this.apiUrl}/${studentId}/disabilities`, data);
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      return new Observable(observer => {
        observer.next(result as T);
        observer.complete();
      });
    };
  }
}
