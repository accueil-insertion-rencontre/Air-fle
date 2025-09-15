import { Session } from './session.model';
import { Student } from './student.model';
import { Course } from './course.model';

export interface Group {
  // ✅ NOUVEAUX CHAMPS (schéma réel)
  group_uuid?: string;
  group_label?: string;
  session_uuid?: string;
  session_label?: string;
  group_started_at?: Date | string;
  group_ended_at?: Date | string;
  group_more_info?: string;
  group_created_at?: Date | string;
  
  // ✅ PROPRIÉTÉS DE COMPATIBILITÉ TEMPORAIRES
  group_id?: number | string;
  id?: string; // ID au format UUID utilisé par l'API
  label?: string;
  session?: Session;
  session_id?: number | string;
  started_at?: Date | string;
  ended_at?: Date | string;
  more_info?: string;
  external_id?: string;
  sessionId?: number | string;
  startedAt?: string;
  endedAt?: string;
  moreInfo?: string;
  externalId?: string;
  students?: Student[];
  courses?: Course[];
}

// Interface pour la création de groupe
export interface CreateGroupRequest {
  group_label: string;
  session_uuid: string;
  group_started_at?: Date | string;
  group_ended_at?: Date | string;
  group_more_info?: string;
}
