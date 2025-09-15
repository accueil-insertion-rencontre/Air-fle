// Exam models based on the API structure
export interface Exam {
  exam_uuid: string;
  exam_label: string;
  exam_taked_at: Date | string;
  exam_type?: 'written' | 'oral' | 'practical';
  exam_created_at?: Date | string;
  students?: ExamStudent[];
}

// Interface pour les étudiants dans un examen
export interface ExamStudent {
  student_uuid: string;
  exam_score?: string;
  exam_status?: 'passed' | 'failed' | 'absent' | 'pending';
  exam_notes?: string;
  student?: {
    student_uuid: string;
    student_firstname: string;
    student_lastname: string;
    student_mail?: string;
  };
}

// DTO for creating a new exam
export interface CreateExamDto {
  exam_label: string;
  exam_taked_at: Date | string;
  exam_type?: 'written' | 'oral' | 'practical';
  // PAS d'étudiants ici - ils seront ajoutés séparément !
}

// DTO for updating an exam
export interface UpdateExamDto {
  exam_label?: string;
  exam_taked_at?: Date | string;
  exam_type?: 'written' | 'oral' | 'practical';
  students?: {
    student_uuid: string;
    exam_score?: string;
    exam_status?: 'passed' | 'failed' | 'absent' | 'pending';
    exam_notes?: string;
  }[];
}

// Response interface for API calls
export interface ExamApiResponse {
  data: Exam[];
  meta: {
    total: number;
    skip: number;
    take: number;
  };
}

// Display interface for the UI
export interface ExamDisplayInfo {
  id: string;
  label: string;
  date: string; // date de passation
  type?: 'written' | 'oral' | 'practical' | string;
  createdAt?: string; // date de création
  score?: string;
  studentName: string;
  studentEmail?: string;
} 