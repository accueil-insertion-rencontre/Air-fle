import { Group } from './group.model';

export interface Session {
  // ✅ NOUVEAUX CHAMPS (schéma réel)
  session_uuid: string;
  session_label: string;
  session_started_at: Date | string;
  session_finished_at: Date | string;
  session_created_at: Date | string;
  
  // Champs optionnels
  session_description?: string;
  
  // Relations
  groups?: Group[];
  
  // ✅ PROPRIÉTÉS DE COMPATIBILITÉ TEMPORAIRES (pour transition)
  id?: string; // Alias pour session_uuid
  label?: string; // Alias pour session_label  
  startedAt?: string; // Alias pour session_started_at
  finishedAt?: string; // Alias pour session_finished_at
  started_at?: Date | string; // Alias pour session_started_at
  finished_at?: Date | string; // Alias pour session_finished_at
}

// Interface pour la création de session
export interface CreateSessionRequest {
  session_label: string;
  session_started_at: Date | string;
  session_finished_at: Date | string;
  session_description?: string;
}
