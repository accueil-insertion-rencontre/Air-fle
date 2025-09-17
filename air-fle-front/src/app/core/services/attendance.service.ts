import { environment } from '@environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiResponse } from '@core/models/reference-data.model';
import { ApiListResponse, Paginated } from '@core/models';

// Interface pour le modèle Absence de l'API backend
export interface Absence {
  id: string;
  absence_uuid?: string;
  absence_status?: string;
  student_id: string;
  course_id: string;
  student_uuid?: string;
  course_uuid?: string;
  reason?: string;
  absence_reason?: string;
  student?: {
    id: string;
    firstname: string;
    lastname: string;
    email?: string;
  };
  course?: {
    course_id: string;
    intitule?: string;
    day?: string;
    start_hour?: string;
    end_hour?: string;
  };
}

// Interface pour créer une absence
export interface CreateAbsenceDto {
  student_uuid: string;
  course_uuid: string;
  absence_reason?: string;
}

// Interface pour mettre à jour une absence
export interface UpdateAbsenceDto {
  student_uuid?: string;
  course_uuid?: string;
  absence_reason?: string;
}

// Interface pour les statistiques d'absences (à implémenter côté backend si nécessaire)
export interface AbsenceStats {
  total_absences: number;
  total_courses: number;
  absence_rate: number;
}

// ===== INTERFACES LEGACY POUR LA COMPATIBILITÉ =====
// Ces interfaces restent pour ne pas casser le code existant
export interface AttendanceRecord {
  id?: number;
  student_id: number | string;
  course_id: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  created_at?: string;
  updated_at?: string;
  comment?: string;
}

export interface AttendanceStatus {
  student_id: number | string;
  status: 'present' | 'absent' | 'late' | 'excused';
  comment?: string;
}

export interface AttendanceStats {
  total_sessions: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  attendance_rate: number;
}

// ===== NOUVELLE API: PRISE D'APPEL PAR COURS (types) =====
export type NewAttendanceStatus = 'present' | 'absent' | 'justified' | 'late';

export interface AttendanceGetResponse {
  course_uuid: string;
  attendance_taken: boolean;
  attendance_taken_at?: string;
  attendance_taken_by?: {
    user_uuid: string;
    user_firstname: string;
    user_lastname: string;
  } | null;
  students: Array<{
    student_uuid: string;
    firstname: string;
    lastname: string;
    status?: NewAttendanceStatus;
    notes?: string | null;
  }>;
  summary?: {
    present: number;
    absent: number;
    justified: number;
    late: number;
  };
}

export interface AttendanceStudentInput {
  student_uuid: string;
  status: NewAttendanceStatus;
  notes?: string;
}

export interface AttendancePostBody {
  students: AttendanceStudentInput[];
}

export interface AttendancePostResponse {
  course_uuid: string;
  attendance_taken: boolean;
  attendance_taken_at: string;
  attendance_taken_by: {
    user_uuid: string;
    user_firstname: string;
    user_lastname: string;
  };
  summary: { present: number; absent: number; justified: number; late: number };
}

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private absenceApiUrl = `${environment.apiUrl}/absences`;
  private attendanceApiUrl = `${environment.apiUrl}/attendance`; // URL legacy pour compatibilité
  private coursesApiUrl = `${environment.apiUrl}/courses`;

  constructor(private http: HttpClient) {}

  // ===== MÉTHODES POUR LA GESTION DES ABSENCES (API BACKEND RÉELLE) =====

  /**
   * Récupère toutes les absences
   */
  getAllAbsences(): Observable<{ data: Absence[]; meta: Record<string, unknown> | undefined }> {
    return this.http.get<Paginated<Absence> | ApiListResponse<Absence> | Absence[]>(this.absenceApiUrl).pipe(
      map((response) => {
        if ('data' in response && 'meta' in response && Array.isArray(response.data)) return { data: response.data, meta: response.meta };
        if ('data' in response && response.data && 'data' in response.data && Array.isArray(response.data.data)) return { data: response.data.data, meta: (response.data as Record<string, unknown>)['meta'] as Record<string, unknown> || {} as Record<string, unknown> };
        if ('data' in response && Array.isArray(response.data)) return { data: response.data, meta: {} as Record<string, unknown> };
        if (Array.isArray(response)) return { data: response as Absence[], meta: {} as Record<string, unknown> };
        return { data: [], meta: {} as Record<string, unknown> };
      })
    );
  }

  /**
   * Récupère une absence par son ID
   */
  getAbsenceById(id: string): Observable<Absence> {
    return this.http.get<Absence>(`${this.absenceApiUrl}/${id}`);
  }

  /**
   * Crée une nouvelle absence
   */
  createAbsence(absenceData: CreateAbsenceDto): Observable<Absence> {
    return this.http.post<Absence>(this.absenceApiUrl, absenceData);
  }

  /**
   * Met à jour une absence existante
   */
  updateAbsence(id: string, absenceData: UpdateAbsenceDto): Observable<Absence> {
    return this.http.patch<Absence>(`${this.absenceApiUrl}/${id}`, absenceData);
  }

  /**
   * Supprime une absence
   */
  deleteAbsence(id: string): Observable<void> {
    return this.http.delete<void>(`${this.absenceApiUrl}/${id}`);
  }

  /**
   * Récupère les absences d'un étudiant spécifique
   */
  getStudentAbsences(studentId: string): Observable<Absence[]> {
    const normalize = (response: Paginated<Absence> | ApiListResponse<Absence> | Absence[]): Absence[] => {
      let data: Absence[] = [];
      if ('data' in response && Array.isArray(response.data)) {
        data = response.data;
      } else if ('data' in response && response.data && 'data' in response.data && Array.isArray(response.data.data)) {
        data = response.data.data;
      } else if (Array.isArray(response)) {
        data = response;
      } else {
        data = [];
      }
      return data.map((a) => {
        const c = (a.course || {}) as Record<string, unknown>;
        const normalizedCourse = {
          course_id: c['course_uuid'] || c['course_id'] || c['id'],
          intitule: c['course_name'] || c['intitule'] || c['title'],
          day: c['course_day'] || c['day'],
          start_hour: c['course_start_hour'] || c['start_hour'],
          end_hour: c['course_end_hour'] || c['end_hour'],
        };
        return { ...a, course: normalizedCourse } as Absence;
      });
    };

    return this.http
      .get<Paginated<Absence> | ApiListResponse<Absence> | Absence[]>(`${this.absenceApiUrl}?student_uuid=${studentId}`)
      .pipe(map(normalize), catchError(() => of([] as Absence[])));
  }

  /**
   * Récupère les absences pour un cours spécifique
   * NOTE: L'API ne supporte pas le filtrage par course_id, donc on récupère tout et on filtre côté client
   */
  getCourseAbsences(courseId: string): Observable<Absence[]> {
    return this.getAllAbsences().pipe(
      map(response => {
        const allAbsences = response.data || [];

        // Filtrer les absences pour le cours spécifique
        const courseAbsences = allAbsences.filter(
          absence => 
            absence.course_id === courseId || 
            absence.course_id === courseId.toString() ||
            absence.course_uuid === courseId ||
            absence.course_uuid === courseId.toString()
        );



        return courseAbsences;
      }),
      catchError(() => {
        // console.error('[getCourseAbsences] Erreur lors de la récupération des absences:', error);
        return of([]);
      })
    );
  }

  // NOTE: L'endpoint DELETE /absences/course/{courseId} n'existe pas côté backend
  // Il faut supprimer les absences individuellement si nécessaire

  // ===== NOUVELLE API: PRISE D'APPEL PAR COURS =====
  getCourseAttendanceNew(courseId: string): Observable<AttendanceGetResponse> {
    return this.http
      .get<ApiResponse<AttendanceGetResponse>>(`${this.coursesApiUrl}/${courseId}/attendance`)
      .pipe(
        map(resp => resp.data),
        catchError(() => of({
          course_uuid: courseId,
          attendance_taken: false,
          students: [],
          summary: { present: 0, absent: 0, justified: 0, late: 0 },
        } as AttendanceGetResponse))
      );
  }

  submitCourseAttendance(courseId: string, body: AttendancePostBody): Observable<AttendancePostResponse> {
    return this.http
      .post<ApiResponse<AttendancePostResponse>>(`${this.coursesApiUrl}/${courseId}/attendance`, body)
      .pipe(
        map(resp => resp.data),
        catchError(err => { throw err; })
      );
  }

  // ===== MÉTHODES LEGACY POUR LA COMPATIBILITÉ =====
  // Ces méthodes restent pour ne pas casser le code existant

  /**
   * Récupère les présences pour un cours spécifique (méthode legacy)
   */
  getCourseAttendance(courseId: number): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(`${this.attendanceApiUrl}/course/${courseId}`);
  }

  /**
   * Enregistre les présences pour un cours (méthode legacy)
   */
  saveCourseAttendance(
    courseId: number,
    attendances: AttendanceStatus[]
  ): Observable<AttendanceRecord[]> {
    return this.http.post<AttendanceRecord[]>(`${this.attendanceApiUrl}/course/${courseId}`, {
      attendances,
    });
  }

  /**
   * Met à jour le statut d'un élève pour un cours (méthode legacy)
   */
  updateStudentAttendance(
    courseId: number,
    studentId: number,
    status: AttendanceStatus
  ): Observable<AttendanceRecord> {
    return this.http.put<AttendanceRecord>(
      `${this.attendanceApiUrl}/course/${courseId}/student/${studentId}`,
      status
    );
  }

  /**
   * Récupère l'historique des absences d'un élève (méthode legacy)
   */
  getStudentAttendanceHistory(studentId: number): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(`${this.attendanceApiUrl}/student/${studentId}`);
  }

  /**
   * Récupère les statistiques de présence d'un élève (méthode legacy)
   */
  getStudentAttendanceStats(studentId: number): Observable<AttendanceStats> {
    return this.http.get<AttendanceStats>(`${this.attendanceApiUrl}/student/${studentId}/stats`);
  }

  /**
   * Marque tous les élèves d'un cours comme présents (méthode legacy)
   */
  markAllPresent(courseId: number, studentIds: number[]): Observable<AttendanceRecord[]> {
    const attendances = studentIds.map(studentId => ({
      student_id: studentId,
      status: 'present' as const,
    }));
    return this.saveCourseAttendance(courseId, attendances);
  }

  /**
   * Marque tous les élèves d'un cours comme absents (méthode legacy)
   */
  markAllAbsent(courseId: number, studentIds: number[]): Observable<AttendanceRecord[]> {
    const attendances = studentIds.map(studentId => ({
      student_id: studentId,
      status: 'absent' as const,
    }));
    return this.saveCourseAttendance(courseId, attendances);
  }

  /**
   * Supprime un enregistrement de présence (méthode legacy)
   */
  deleteAttendanceRecord(recordId: number): Observable<void> {
    return this.http.delete<void>(`${this.attendanceApiUrl}/${recordId}`);
  }

  /**
   * Ajoute une absence manuelle pour un élève (méthode legacy)
   */
  addManualAbsence(
    studentId: number,
    courseId: number,
    comment?: string
  ): Observable<AttendanceRecord> {
    return this.http.post<AttendanceRecord>(`${this.attendanceApiUrl}/manual`, {
      student_id: studentId,
      course_id: courseId,
      status: 'absent',
      comment,
    });
  }
}
