import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Exam, CreateExamDto, UpdateExamDto, ExamDisplayInfo } from '../models/exam.model';
import { ApiListResponse, Paginated } from '../models';

// Nouvelles interfaces pour les nouveaux endpoints
export interface ExamStudentDto {
  student_uuid: string;
  exam_uuid: string;
  exam_score?: string;
  exam_status?: 'passed' | 'failed' | 'absent' | 'pending';
  exam_notes?: string;
}

export interface UpdateExamStudentDto {
  exam_score?: string;
  exam_status?: 'passed' | 'failed' | 'absent' | 'pending';
  exam_notes?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ExamService {
  private readonly apiUrl = `${environment.apiUrl}/exams`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les examens
   */
  getAllExams(): Observable<Exam[]> {
    
    return this.http.get<ApiListResponse<Exam> | Paginated<Exam> | Exam[] | Record<string, unknown>>(this.apiUrl).pipe(
      map((response: ApiListResponse<Exam> | Paginated<Exam> | Exam[] | Record<string, unknown>) => {
        if (response && Array.isArray((response as Record<string, unknown>)['data'])) return (response as Record<string, unknown>)['data'] as Exam[];
        if (response && (response as Record<string, unknown>)['data'] && Array.isArray(((response as Record<string, unknown>)['data'] as Record<string, unknown>)['data'])) return ((response as Record<string, unknown>)['data'] as Record<string, unknown>)['data'] as Exam[];
        if (response && Array.isArray((response as Record<string, unknown>)['exams'])) return (response as Record<string, unknown>)['exams'] as Exam[];
        if (Array.isArray(response)) return response as Exam[];
        return [];
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère un examen par son ID
   */
  getExamById(id: string): Observable<Exam> {
    
    return this.http.get<{data: Exam} | Exam>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        
        
        // Extraire les données de l'examen depuis response.data
        if (response && 'data' in response) {
          return response.data;
        } else if (response && 'exam_uuid' in response) {
          return response as Exam;
        } else {
          return response as Exam;
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les examens d'un étudiant spécifique
   */
  getExamsByStudent(studentId: string): Observable<Exam[]> {
    return this.http.get<{data: Exam[]} | Exam[]>(`${this.apiUrl}/student/${studentId}`).pipe(
      map(response => {
        if (response && 'data' in response) {
          return response.data;
        } else if (Array.isArray(response)) {
          return response;
        } else {
          return [];
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Crée un nouvel examen
   */
  createExam(examData: CreateExamDto): Observable<Exam> {
    
    return this.http.post<{data: Exam} | Exam>(this.apiUrl, examData).pipe(
      map(response => {
        
        
        // L'API retourne { data: {...}, success: true, ... }
        // On doit extraire les données de l'examen depuis response.data
        if (response && 'data' in response) {
          return response.data; // Retourner directement les données de l'examen
        } else if (response && 'exam_uuid' in response) {
          return response as Exam; // Si les données sont directement dans response
        } else {
          return response as Exam;
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Met à jour un examen existant
   */
  updateExam(id: string, examData: UpdateExamDto): Observable<Exam> {
    
    return this.http.patch<{data: Exam} | Exam>(`${this.apiUrl}/${id}`, examData).pipe(
      map(response => {
        
        
        // Extraire les données de l'examen depuis response.data
        if (response && 'data' in response) {
          return response.data;
        } else if (response && 'exam_uuid' in response) {
          return response as Exam;
        } else {
          return response as Exam;
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Supprime un examen
   */
  deleteExam(id: string): Observable<Exam> {
    
    return this.http.delete<{data: Exam} | Exam>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        
        
        // Extraire les données de l'examen depuis response.data si disponible
        if (response && 'data' in response) {
          return response.data;
        } else if (response && 'exam_uuid' in response) {
          return response as Exam;
        } else {
          return response as Exam;
        }
      }),
      catchError(this.handleError)
    );
  }

  // getExamStudents supprimé au profit de la version paginée

  getExamStudentsPaginated(examId: string, page: number, pageSize: number): Observable<{data:Record<string, unknown>[]; meta:Record<string, unknown>}> {
    const params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
    return this.http.get<{data: {data: ExamStudentDto[]; meta: Record<string, unknown>}} | {data: ExamStudentDto[]; meta: Record<string, unknown>} | ExamStudentDto[]>(`${this.apiUrl}/${examId}/students`, { params }).pipe(
      map(response => {
        // Cas 1: wrapper global { data: { data: [...], meta: {...} } }
        if (response && 'data' in response && 'data' in response.data && Array.isArray((response.data as Record<string, unknown>)['data'])) {
          return { data: (response.data as Record<string, unknown>)['data'] as Record<string, unknown>[], meta: ((response.data as Record<string, unknown>)['meta'] || {}) as Record<string, unknown> };
        }
        // Cas 2: sans wrapper { data: [...], meta: {...} }
        if (response && 'data' in response && Array.isArray(response.data) && 'meta' in response) {
          return { data: response.data as unknown as Record<string, unknown>[], meta: response.meta as Record<string, unknown> };
        }
        // Cas 3: tableau brut
        if (Array.isArray(response)) {
          return { data: response as unknown as Record<string, unknown>[], meta: { total: response.length, page, pageSize, totalPages: 1 } as Record<string, unknown> };
        }
        // Fallback
        return { data: [], meta: { total: 0, page, pageSize, totalPages: 1 } as Record<string, unknown> };
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Ajoute un étudiant à un examen
   */
  addStudentToExam(examStudentData: ExamStudentDto): Observable<ExamStudentDto> {
    return this.http.post<{data: ExamStudentDto} | ExamStudentDto>(`${this.apiUrl}/student`, examStudentData).pipe(
      map(response => {
        if (response && 'data' in response) {
          return response.data;
        } else {
          return response;
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Met à jour le score d'un étudiant pour un examen
   */
  updateStudentExamScore(studentUuid: string, examUuid: string, updateData: UpdateExamStudentDto): Observable<ExamStudentDto> {
    return this.http.patch<{data: ExamStudentDto} | ExamStudentDto>(`${this.apiUrl}/student/${studentUuid}/${examUuid}`, updateData).pipe(
      map(response => {
        if (response && 'data' in response) {
          return response.data;
        } else {
          return response;
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Retire un étudiant d'un examen
   */
  removeStudentFromExam(studentUuid: string, examUuid: string): Observable<void> {
    return this.http.delete<{data: void} | void>(`${this.apiUrl}/student/${studentUuid}/${examUuid}`).pipe(
      map(response => {
        if (response && 'data' in response) {
          return response.data;
        } else {
          return response;
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Ajoute tous les étudiants d'un groupe à un examen
   */
  addGroupToExam(examUuid: string, groupUuid: string, defaultScore?: string, defaultStatus?: string): Observable<{added: number; students: ExamStudentDto[]}> {
    let params = new HttpParams();
    
    if (defaultScore) {
      params = params.set('defaultScore', defaultScore);
    }
    
    if (defaultStatus) {
      params = params.set('defaultStatus', defaultStatus);
    }
    
    const url = `${this.apiUrl}/group/${examUuid}/${groupUuid}`;
    
    return this.http.post<{data: {added: number; students: ExamStudentDto[]}} | {added: number; students: ExamStudentDto[]}>(url, {}, { params }).pipe(
      tap(() => {
      }),
      map((response) => {
        if (response && 'data' in response) {
          return (response as {data: {added: number; students: ExamStudentDto[]}}).data;
        } else {
          return response as {added: number; students: ExamStudentDto[]};
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Convertit un examen en format d'affichage
   */
  getExamDisplayInfo(exam: Exam): ExamDisplayInfo {
    // Conversion pour accès flexible aux propriétés
    const examData = exam as unknown as Record<string, unknown>;
    
    // Extraction flexible du libellé
    const label = (examData['exam_label'] || examData['label'] || examData['title'] || 'Examen sans titre') as string;
    
    // Pour la nouvelle structure, on peut avoir plusieurs étudiants
    let studentName = 'Examen sans étudiants';
    let studentEmail = '';
    
    if (examData['students'] && (examData['students'] as unknown[]).length > 0) {
      // Nouvelle structure avec plusieurs étudiants
      const firstStudent = (examData['students'] as Record<string, unknown>[])[0];
      const student = (firstStudent['student'] || firstStudent) as Record<string, unknown>;
      
      const firstName = student['student_firstname'] || student['firstname'] || student['first_name'] || student['prenom'] || '';
      const lastName = student['student_lastname'] || student['lastname'] || student['last_name'] || student['nom'] || '';
      
      if (firstName || lastName) {
        studentName = `${firstName} ${lastName}`.trim();
      } else {
        studentName = `Étudiant (ID: ${firstStudent['student_uuid']})`;
      }
      
      studentEmail = (student['student_mail'] || student['email'] || student['mail'] || '') as string;
      
      // Si il y a plusieurs étudiants, indiquer le nombre
      if ((examData['students'] as unknown[]).length > 1) {
        studentName += ` (+${(examData['students'] as unknown[]).length - 1} autres)`;
      }
    } else if (examData['student']) {
      // Ancienne structure avec un seul étudiant
      const student = examData['student'] as Record<string, unknown>;
      
      const firstName = student['student_firstname'] || student['firstname'] || student['first_name'] || student['prenom'] || '';
      const lastName = student['student_lastname'] || student['lastname'] || student['last_name'] || student['nom'] || '';
      
      if (firstName || lastName) {
        studentName = `${firstName} ${lastName}`.trim();
      } else {
        studentName = `Étudiant (ID: ${examData['student_uuid']})`;
      }
      
      studentEmail = (student['student_mail'] || student['email'] || student['mail'] || '') as string;
    }
    
    // Extraction flexible de la note (pour compatibilité)
    const score = examData['exam_score'] || examData['score'] || undefined;
    const type = examData['exam_type'] || examData['type'] || undefined;
    const createdAt = examData['exam_created_at'] || examData['created_at'] || undefined;
    
    return {
      id: (examData['exam_uuid'] || examData['id'] || '') as string,
      label: label,
      date: this.formatDate((examData['exam_taked_at'] || examData['date'] || examData['taken_at']) as string | Date),
      type: type as string | undefined,
      createdAt: createdAt ? this.formatDate(createdAt as string | Date) : undefined,
      score: score as string | undefined,
      studentName: studentName, 
      studentEmail: studentEmail
    };
  }

  /**
   * Convertit une liste d'examens en format d'affichage
   */
  getExamsDisplayInfo(exams: Exam[]): ExamDisplayInfo[] {
    if (!Array.isArray(exams)) {
      return [];
    }
    return exams.map(exam => this.getExamDisplayInfo(exam));
  }

  /**
   * Formate une date pour l'affichage
   */
  private formatDate(date: Date | string): string {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    // console.error('❌ ExamService: Erreur HTTP:', error);
    
    let errorMessage = 'Une erreur inconnue s\'est produite';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur côté client: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 400:
          errorMessage = 'Données invalides. Veuillez vérifier votre saisie.';
          break;
        case 401:
          errorMessage = 'Vous devez être connecté pour effectuer cette action.';
          break;
        case 403:
          errorMessage = 'Vous n\'avez pas les droits pour effectuer cette action.';
          break;
        case 404:
          errorMessage = 'Examen non trouvé.';
          break;
        case 500:
          errorMessage = 'Erreur interne du serveur. Veuillez réessayer plus tard.';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.error?.message || error.message}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
} 