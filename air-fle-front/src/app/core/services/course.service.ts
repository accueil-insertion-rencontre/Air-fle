import { environment } from '@environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Course, CreateCourseRequest, UpdateCourseRequest } from '../models/course.model';
import { ApiListResponse, Paginated } from '../models';
import { Schedule } from '../models/course.model';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private apiUrl = `${environment.apiUrl}/courses`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les cours avec les données de session
   */
  getCourses(): Observable<Course[]> {
    // 🔧 FIX: Utiliser expand=group.session pour récupérer les sessions (pattern moderne)
    return this.http.get<any>(`${this.apiUrl}?expand=group.session`).pipe(
      map((response: ApiListResponse<Course> | Paginated<Course> | any) => {
        if (response && Array.isArray(response.data)) return (response.data as any[]).map(c => this.convertToFrontendModel(c));
        if (response && response.data && Array.isArray(response.data.data)) return (response.data.data as any[]).map(c => this.convertToFrontendModel(c));
        if (Array.isArray(response)) return (response as any[]).map(c => this.convertToFrontendModel(c));
        return [];
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère un cours par son ID
   */
  getCourseById(id: string | number): Observable<Course> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (response && response.data) {
          return this.convertToFrontendModel(response.data);
        }
        throw new Error('Cours non trouvé');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les cours d'une session
   */
  getCoursesBySessionId(sessionId: string | number): Observable<Course[]> {
    return this.http.get<any>(`${this.apiUrl}/session/${sessionId}`).pipe(
      map((response: ApiListResponse<Course> | any) => {
        if (response && Array.isArray(response.data)) return (response.data as any[]).map(c => this.convertToFrontendModel(c));
        if (Array.isArray(response)) return (response as any[]).map(c => this.convertToFrontendModel(c));
        return [];
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les cours d'une période donnée
   */
  getCoursesByDateRange(
    startDate: string,
    endDate: string,
    sessionId?: string | number,
    page?: number,
    pageSize?: number
  ): Observable<Course[]> {
    const params: string[] = [];
    if (sessionId) params.push(`session_uuid=${encodeURIComponent(String(sessionId))}`);
    if (startDate) params.push(`start_date=${encodeURIComponent(startDate)}`);
    if (endDate) params.push(`end_date=${encodeURIComponent(endDate)}`);
    if (page) params.push(`page=${page}`);
    if (pageSize) params.push(`pageSize=${pageSize}`);
    const url = `${this.apiUrl}?${params.join('&')}`;

    return this.http.get<any>(url).pipe(
      map((response: ApiListResponse<Course> | Paginated<Course> | any) => {
        // Supporte {data:[...]} ou {data:{data:[...],meta}} ou tableau brut
        if (response && Array.isArray(response.data)) return (response.data as any[]).map(c => this.convertToFrontendModel(c));
        if (response && response.data && Array.isArray(response.data.data)) return (response.data.data as any[]).map(c => this.convertToFrontendModel(c));
        if (Array.isArray(response)) return (response as any[]).map(c => this.convertToFrontendModel(c));
        return [];
      }),
      catchError(() => {
        return new Observable<Course[]>(observer => { observer.next([]); observer.complete(); });
      })
    );
  }

  /**
   * Crée un nouveau cours
   */
  createCourse(course: Partial<Course>): Observable<Course> {
    const apiCourse = this.convertToApiModel(course);

    return this.http.post<any>(this.apiUrl, apiCourse).pipe(
      map(response => {
        if (response && response.data) {
          return this.convertToFrontendModel(response.data);
        }
        throw new Error('Erreur lors de la création du cours');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Met à jour un cours
   */
  updateCourse(id: string | number, course: Partial<Course>): Observable<Course> {
    const apiCourse = this.convertToApiModel(course);

    return this.http.patch<any>(`${this.apiUrl}/${id}`, apiCourse).pipe(
      map(response => {
        if (response && response.data) {
          return this.convertToFrontendModel(response.data);
        }
        throw new Error('Erreur lors de la mise à jour du cours');
      }),
      catchError(() => {
        // Fallback avec PUT
        return this.http.put<any>(`${this.apiUrl}/${id}`, apiCourse).pipe(
          map(response => {
            if (response && response.data) {
              return this.convertToFrontendModel(response.data);
            }
            throw new Error('Erreur lors de la mise à jour du cours');
          }),
          catchError(putError => {
            if (putError.status === 404) {
              throw new Error(`Le cours avec l'ID ${id} n'a pas été trouvé`);
            } else if (putError.status === 405) {
              throw new Error("La modification de cours n'est pas supportée par l'API");
            } else {
              throw new Error(
                `Erreur lors de la mise à jour: ${putError.message || 'Erreur inconnue'}`
              );
            }
          })
        );
      })
    );
  }

  /**
   * Met à jour un cours (alternative: supprime et recrée)
   */
  updateCourseAlternative(id: string | number, course: Partial<Course>): Observable<Course> {
    return this.deleteCourse(id).pipe(
      switchMap(() => {
        return this.createCourse(course);
      }),
      catchError(() => {
        throw new Error('Impossible de modifier le cours (suppression/création échouée)');
      })
    );
  }

  /**
   * Supprime un cours
   */
  deleteCourse(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
  }

  /**
   * Récupère les cours par groupe
   */
  getCoursesByGroupId(groupId: string | number): Observable<Course[]> {
    return this.http.get<any>(`${this.apiUrl}/group/${groupId}`).pipe(
      map((response: ApiListResponse<Course> | any) => {
        if (response && Array.isArray(response.data)) return (response.data as any[]).map(c => this.convertToFrontendModel(c));
        if (Array.isArray(response)) return (response as any[]).map(c => this.convertToFrontendModel(c));
        return [];
      }),
      catchError(() => {
        // Fallback : récupérer tous les cours et filtrer
        return this.getCourses().pipe(
          map((allCourses: Course[]) => {
            return allCourses.filter(course => 
              course.group_uuid?.toString() === groupId?.toString() ||
              course.group_id?.toString() === groupId?.toString()
            );
          })
        );
      })
    );
  }

  /**
   * Récupère le planning sous forme de Schedule
   */
  getSchedule(start: Date, end: Date): Observable<Schedule[]> {
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    return this.getCoursesByDateRange(startStr, endStr).pipe(
      map(courses => courses.map(course => this.courseToSchedule(course)))
    );
  }

  /**
   * Convertit une réponse API vers le modèle frontend
   */
  private convertToFrontendModel(apiCourse: any): Course {
    return {
      // ✅ NOUVEAUX CHAMPS
      course_uuid: apiCourse.course_uuid,
      course_name: apiCourse.course_name,
      course_day: this.extractDateFromDateTime(apiCourse.course_day),
      course_start_hour: this.extractTimeFromDate(apiCourse.course_start_hour),
      course_end_hour: this.extractTimeFromDate(apiCourse.course_end_hour),
      group_uuid: apiCourse.group_uuid,
      course_color: apiCourse.course_color,
      course_created_at: apiCourse.course_created_at,

      // flags d'appel
      attendance_taken: apiCourse.attendance_taken ?? false,
      attendance_taken_at: apiCourse.attendance_taken_at,
      attendance_taken_by_user_uuid: apiCourse.attendance_taken_by_user_uuid,
      attendance_taken_by: apiCourse.attendance_taken_by
        ? {
            user_uuid: apiCourse.attendance_taken_by.user_uuid,
            user_firstname: apiCourse.attendance_taken_by.user_firstname,
            user_lastname: apiCourse.attendance_taken_by.user_lastname,
          }
        : undefined,

      // 🔄 ANCIENS CHAMPS (fallback)
      course_id: apiCourse.course_id || apiCourse.id,
      id: apiCourse.course_uuid || apiCourse.id,
      session_id: apiCourse.session_uuid || apiCourse.session_id,
      group_id: apiCourse.group_uuid || apiCourse.group_id,
      day: this.extractDateFromDateTime(apiCourse.course_day || apiCourse.day),
      start_hour: this.extractTimeFromDate(apiCourse.course_start_hour || apiCourse.start_hour),
      end_hour: this.extractTimeFromDate(apiCourse.course_end_hour || apiCourse.end_hour),
      title: apiCourse.course_name || apiCourse.title || apiCourse.intitule,
      intitule: apiCourse.course_name || apiCourse.intitule,
      user_id: apiCourse.user_uuid || apiCourse.user_id,
      color: apiCourse.course_color || apiCourse.color,

      // Relations
      session: apiCourse.group?.session ? {
        session_uuid: apiCourse.group.session.session_uuid,
        session_label: apiCourse.group.session.session_label,
        session_id: apiCourse.group.session.session_uuid || apiCourse.group.session.session_id,
        label: apiCourse.group.session.session_label || apiCourse.group.session.label
      } : undefined,

      group: apiCourse.group ? {
        group_uuid: apiCourse.group.group_uuid,
        group_label: apiCourse.group.group_label,
        group_id: apiCourse.group.group_uuid || apiCourse.group.group_id,
        label: apiCourse.group.group_label || apiCourse.group.label
      } : undefined,

      user: apiCourse.user ? {
        user_uuid: apiCourse.user.user_uuid,
        user_firstname: apiCourse.user.user_firstname,
        user_lastname: apiCourse.user.user_lastname,
        user_mail: apiCourse.user.user_mail,
        user_id: apiCourse.user.user_uuid || apiCourse.user.user_id,
        firstname: apiCourse.user.user_firstname || apiCourse.user.firstname,
        lastname: apiCourse.user.user_lastname || apiCourse.user.lastname,
        email: apiCourse.user.user_mail || apiCourse.user.email
      } : undefined,

      created_at: apiCourse.course_created_at || apiCourse.created_at,
      updated_at: apiCourse.updated_at
    };
  }

  /**
   * 🔧 FIX: Extrait la date d'un DateTime ISO (YYYY-MM-DD)
   */
  private extractDateFromDateTime(dateInput: string | Date): string {
    if (!dateInput) return '';
    
    if (typeof dateInput === 'string') {
      // Si c'est déjà au format YYYY-MM-DD, le retourner tel quel
      if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateInput;
      }
      // Si c'est un ISO datetime, extraire la partie date
      if (dateInput.includes('T')) {
        return dateInput.split('T')[0];
      }
      return dateInput;
    }
    
    // Si c'est un objet Date
    const date = new Date(dateInput);
    return date.toISOString().split('T')[0];
  }

  /**
   * Extrait l'heure d'une date (HH:MM)
   */
  private extractTimeFromDate(dateInput: string | Date): string {
    if (!dateInput) return '';
    
    if (typeof dateInput === 'string') {
      if (dateInput.includes('T')) {
        return dateInput.split('T')[1].substring(0, 5);
      }
      return dateInput;
    }
    
    return new Date(dateInput).toTimeString().substring(0, 5);
  }

  /**
   * Convertit un modèle frontend vers l'API
   */
  private convertToApiModel(course: Partial<Course>): CreateCourseRequest | UpdateCourseRequest {
    return {
      course_name: course.course_name || course.title || course.intitule || '',
      course_day: course.course_day || course.day || '',
      course_start_hour: course.course_start_hour || course.start_hour || '',
      course_end_hour: course.course_end_hour || course.end_hour || '',
      group_uuid: (course.group_uuid || course.group_id || '').toString(),
      course_color: course.course_color || course.color,
      user_uuid: course.user_uuid || course.user_id?.toString()
    };
  }

  /**
   * Convertit un cours en Schedule pour le calendrier
   */
  private courseToSchedule(course: Course): Schedule {
    const day = course.course_day || course.day || '';
    const startHour = course.course_start_hour || course.start_hour || '09:00';
    const endHour = course.course_end_hour || course.end_hour || '12:00';

    return {
      id: course.course_uuid || course.course_id || course.id,
      title: course.course_name || course.title || course.intitule || 'Cours',
      start: new Date(`${day}T${startHour}:00`),
      end: new Date(`${day}T${endHour}:00`),
      groupId: course.group_uuid || course.group_id,
      color: course.course_color || course.color || '#007bff',
      sessionId: course.session?.session_uuid || course.session?.session_id,
      courseId: course.course_uuid || course.course_id
    };
  }

  /**
   * Gestion des erreurs
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      errorMessage = `Code d'erreur: ${error.status}, message: ${error.message}`;
    }

    return throwError(() => new Error(errorMessage));
  }
}
