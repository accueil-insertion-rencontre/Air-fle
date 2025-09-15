// Continuation model basé sur le vrai schéma Prisma
export interface Continuation {
  continuation_uuid: string;
  continuation_temporality?: string | null;
  continuation_commentary?: string | null;
  student_uuid: string;
  
  // Relations (optionnelles pour les requêtes avec include)
  student?: {
    student_uuid: string;
    student_firstname: string;
    student_lastname: string;
    student_mail?: string;
  };
}

// DTO pour créer une continuation
export interface CreateContinuationDto {
  studentId: string; // Le backend attend studentId, pas student_uuid
  temporality?: string | null; // Le backend attend temporality, pas continuation_temporality
  commentary?: string | null; // Le backend attend commentary, pas continuation_commentary
}

// DTO pour mettre à jour une continuation
export interface UpdateContinuationDto {
  temporality?: string | null; // Le backend attend temporality, pas continuation_temporality
  commentary?: string | null; // Le backend attend commentary, pas continuation_commentary
}

// Réponse de l'API avec liste
export interface ContinuationListResponse {
  continuations: Continuation[];
  total: number;
}

// Filtres pour les continuations
export interface ContinuationFilters {
  student_uuid?: string;
  student_name?: string; // Pour filtrer par nom d'étudiant
  date_from?: string;
  date_to?: string;
}

// Statistiques simples pour les continuations
export interface ContinuationStats {
  total_continuations: number;
  continuations_with_date: number;
  continuations_without_date: number;
  recent_continuations: number; // Derniers 30 jours
}

// Types pour les opérations spécifiques aux étudiants, sessions et groupes
export interface StudentContinuation {
  student_uuid: string;
  student_firstname: string;
  student_lastname: string;
  current_level: string;
  recommended_level: string;
  exam_average?: number;
  can_continue: boolean;
  continuation_suggestions: {
    level: string;
    sessions: {
      session_uuid: string;
      session_label: string;
      available_spots: number;
    }[];
  }[];
}

export interface SessionContinuation {
  session_uuid: string;
  session_label: string;
  level_uuid: string;
  level_code: string;
  students_eligible: {
    student_uuid: string;
    student_name: string;
    current_level: string;
  }[];
  available_spots: number;
  start_date: Date | string;
}

export interface GroupContinuation {
  group_uuid: string;
  group_label: string;
  session_uuid: string;
  session_label: string;
  level_code: string;
  students_in_group: number;
  max_capacity: number;
  students_eligible_for_continuation: {
    student_uuid: string;
    student_name: string;
    ready_for_next_level: boolean;
  }[];
} 