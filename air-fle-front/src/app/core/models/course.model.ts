
export interface Course {
  // ✅ NOUVEAUX CHAMPS API
  course_uuid?: string;
  course_name: string;
  course_day: string; // Format YYYY-MM-DD
  course_start_hour: string; // Format HH:MM
  course_end_hour: string; // Format HH:MM
  group_uuid: string;
  course_color?: string;
  course_created_at?: Date;

  // Prise d'appel
  attendance_taken?: boolean;
  attendance_taken_at?: string;
  attendance_taken_by_user_uuid?: string;
  attendance_taken_by?: {
    user_uuid: string;
    user_firstname: string;
    user_lastname: string;
  } | null;

  // 🔄 ANCIENS CHAMPS (pour compatibilité temporaire - à supprimer progressivement)
  course_id?: number | string;
  id?: number | string;
  session_id?: number | string;
  group_id?: number | string; 
  day?: string; 
  start_hour?: string; 
  end_hour?: string; 
  title?: string; 
  intitule?: string; 
  user_id?: number | string; 
  user_uuid?: string;
  color?: string;

  // Relations enrichies
  session?: {
    session_uuid?: string;
    session_label?: string;
    // Anciens pour compatibilité
    session_id?: number | string;
    label?: string;
  };
  group?: {
    group_uuid?: string;
    group_label?: string;
    // Anciens pour compatibilité
    group_id?: number | string;
    label?: string;
  };
  user?: {
    user_uuid?: string;
    user_firstname?: string;
    user_lastname?: string;
    user_mail?: string;
    // Anciens pour compatibilité
    user_id?: number | string;
    firstname?: string;
    lastname?: string;
    email?: string;
  };

  // Timestamps
  created_at?: string;
  updated_at?: string;
}

// Interface pour les requêtes de création
export interface CreateCourseRequest {
  course_name: string;
  course_day: string;
  course_start_hour: string;
  course_end_hour: string;
  group_uuid: string;
  course_color?: string;
  user_uuid?: string;
}

// Interface pour les requêtes de mise à jour
export interface UpdateCourseRequest {
  course_name?: string;
  course_day?: string;
  course_start_hour?: string;
  course_end_hour?: string;
  group_uuid?: string;
  course_color?: string;
  user_uuid?: string;
}

export interface Schedule {
  id?: number | string;
  title: string;
  start: Date;
  end: Date;
  groupId?: number | string;
  color?: string;
  allDay?: boolean;
  sessionId?: number | string;
  courseId?: number | string;
}
