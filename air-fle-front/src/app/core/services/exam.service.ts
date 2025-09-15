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
    
    return this.http.get<any>(this.apiUrl).pipe(
      map((response: ApiListResponse<Exam> | Paginated<Exam> | any) => {
        if (response && Array.isArray(response.data)) return response.data as Exam[];
        if (response && response.data && Array.isArray(response.data.data)) return response.data.data as Exam[];
        if (response && Array.isArray(response.exams)) return response.exams as Exam[];
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
    
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        
        
        // Extraire les données de l'examen depuis response.data
        if (response && response.data) {
          return response.data;
        } else if (response && response.exam_uuid) {
          return response;
        } else {
          console.warn('⚠️ Format de réponse inattendu pour getExamById:', response);
          return response;
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les examens d'un étudiant spécifique
   */
  getExamsByStudent(studentId: string): Observable<Exam[]> {
    return this.http.get<any>(`${this.apiUrl}/student/${studentId}`).pipe(
      map(response => {
        if (response && response.data) {
          return response.data;
        } else if (Array.isArray(response)) {
          return response;
        } else {
          console.warn('⚠️ Format de réponse inattendu pour getExamsByStudent:', response);
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
    
    return this.http.post<any>(this.apiUrl, examData).pipe(
      map(response => {
        
        
        // L'API retourne { data: {...}, success: true, ... }
        // On doit extraire les données de l'examen depuis response.data
        if (response && response.data) {
          return response.data; // Retourner directement les données de l'examen
        } else if (response && response.exam_uuid) {
          return response; // Si les données sont directement dans response
        } else {
          console.warn('⚠️ Format de réponse inattendu pour createExam:', response);
          return response;
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Met à jour un examen existant
   */
  updateExam(id: string, examData: UpdateExamDto): Observable<Exam> {
    
    return this.http.patch<any>(`${this.apiUrl}/${id}`, examData).pipe(
      map(response => {
        
        
        // Extraire les données de l'examen depuis response.data
        if (response && response.data) {
          return response.data;
        } else if (response && response.exam_uuid) {
          return response;
        } else {
          console.warn('⚠️ Format de réponse inattendu pour updateExam:', response);
          return response;
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Supprime un examen
   */
  deleteExam(id: string): Observable<Exam> {
    
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        
        
        // Extraire les données de l'examen depuis response.data si disponible
        if (response && response.data) {
          return response.data;
        } else if (response && response.exam_uuid) {
          return response;
        } else {
          console.warn('⚠️ Format de réponse inattendu pour deleteExam:', response);
          return response;
        }
      }),
      catchError(this.handleError)
    );
  }

  // getExamStudents supprimé au profit de la version paginée

  getExamStudentsPaginated(examId: string, page: number, pageSize: number): Observable<{data:any[]; meta:any}> {
    const params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
    return this.http.get<any>(`${this.apiUrl}/${examId}/students`, { params }).pipe(
      map(response => {
        // Cas 1: wrapper global { data: { data: [...], meta: {...} } }
        if (response && response.data && Array.isArray(response.data.data)) {
          return { data: response.data.data, meta: response.data.meta || {} };
        }
        // Cas 2: sans wrapper { data: [...], meta: {...} }
        if (response && Array.isArray(response.data) && response.meta) {
          return { data: response.data, meta: response.meta };
        }
        // Cas 3: tableau brut
        if (Array.isArray(response)) {
          return { data: response, meta: { total: response.length, page, pageSize, totalPages: 1 } };
        }
        // Fallback
        console.warn('⚠️ Format de réponse inattendu pour getExamStudentsPaginated:', response);
        return { data: [], meta: { total: 0, page, pageSize, totalPages: 1 } };
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Ajoute un étudiant à un examen
   */
  addStudentToExam(examStudentData: ExamStudentDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/student`, examStudentData).pipe(
      map(response => {
        if (response && response.data) {
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
  updateStudentExamScore(studentUuid: string, examUuid: string, updateData: UpdateExamStudentDto): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/student/${studentUuid}/${examUuid}`, updateData).pipe(
      map(response => {
        if (response && response.data) {
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
  removeStudentFromExam(studentUuid: string, examUuid: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/student/${studentUuid}/${examUuid}`).pipe(
      map(response => {
        if (response && response.data) {
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
  addGroupToExam(examUuid: string, groupUuid: string, defaultScore?: string, defaultStatus?: string): Observable<any> {
    let params = new HttpParams();
    
    if (defaultScore) {
      params = params.set('defaultScore', defaultScore);
    }
    
    if (defaultStatus) {
      params = params.set('defaultStatus', defaultStatus);
    }
    
    const url = `${this.apiUrl}/group/${examUuid}/${groupUuid}`;
    console.log('🔍 ExamService: URL appelée:', url);
    console.log('🔍 ExamService: Paramètres:', { examUuid, groupUuid, defaultScore, defaultStatus });
    console.log('🔍 ExamService: Paramètres HTTP:', params.toString());
    
    return this.http.post<any>(url, {}, { params }).pipe(
      tap((response: any) => {
        console.log('✅ ExamService: Réponse API brute:', response);
      }),
      map((response: any) => {
        if (response && response.data) {
          return response.data;
        } else {
          return response;
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
    const examData = exam as any;
    
    // Extraction flexible du libellé
    const label = examData.exam_label || examData.label || examData.title || 'Examen sans titre';
    
    // Pour la nouvelle structure, on peut avoir plusieurs étudiants
    let studentName = 'Examen sans étudiants';
    let studentEmail = '';
    
    if (examData.students && examData.students.length > 0) {
      // Nouvelle structure avec plusieurs étudiants
      const firstStudent = examData.students[0];
      const student = firstStudent.student || firstStudent;
      
      const firstName = student.student_firstname || student.firstname || student.first_name || student.prenom || '';
      const lastName = student.student_lastname || student.lastname || student.last_name || student.nom || '';
      
      if (firstName || lastName) {
        studentName = `${firstName} ${lastName}`.trim();
      } else {
        studentName = `Étudiant (ID: ${firstStudent.student_uuid})`;
      }
      
      studentEmail = student.student_mail || student.email || student.mail || '';
      
      // Si il y a plusieurs étudiants, indiquer le nombre
      if (examData.students.length > 1) {
        studentName += ` (+${examData.students.length - 1} autres)`;
      }
    } else if (examData.student) {
      // Ancienne structure avec un seul étudiant
      const student = examData.student as any;
      
      const firstName = student.student_firstname || student.firstname || student.first_name || student.prenom || '';
      const lastName = student.student_lastname || student.lastname || student.last_name || student.nom || '';
      
      if (firstName || lastName) {
        studentName = `${firstName} ${lastName}`.trim();
      } else {
        studentName = `Étudiant (ID: ${examData.student_uuid})`;
      }
      
      studentEmail = student.student_mail || student.email || student.mail || '';
    }
    
    // Extraction flexible de la note (pour compatibilité)
    const score = examData.exam_score || examData.score || undefined;
    const type = examData.exam_type || examData.type || undefined;
    const createdAt = examData.exam_created_at || examData.created_at || undefined;
    
    return {
      id: examData.exam_uuid || examData.id || '',
      label: label,
      date: this.formatDate(examData.exam_taked_at || examData.date || examData.taken_at),
      type: type,
      createdAt: createdAt ? this.formatDate(createdAt) : undefined,
      score: score,
      studentName: studentName, 
      studentEmail: studentEmail
    };
  }

  /**
   * Convertit une liste d'examens en format d'affichage
   */
  getExamsDisplayInfo(exams: Exam[]): ExamDisplayInfo[] {
    if (!Array.isArray(exams)) {
      console.warn('getExamsDisplayInfo: exams n\'est pas un tableau:', exams);
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
    console.error('❌ ExamService: Erreur HTTP:', error);
    
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