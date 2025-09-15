// ✅ INTERFACE USER UNIQUE - BASÉE SUR SCHÉMA PRISMA
export interface User {
  user_uuid: string;
  user_firstname: string;
  user_lastname: string;
  user_mail: string;
  user_password?: string; // Généralement pas renvoyé par l'API
  user_birthdate?: string | null;
  user_isactive: boolean;
  user_created_at: Date;
  user_updated_at?: string;
  role_uuid: string;
  
  // Structure du rôle (si incluse dans la réponse)
  role?: {
    role_uuid: string;
    role_name: string;
    role_description?: string;
    role_created_at?: string;
  };
  
  // ✅ PROPRIÉTÉS DE COMPATIBILITÉ TEMPORAIRES
  id?: string | number;
  email?: string;
  firstname?: string;
  lastname?: string;
  isActive?: boolean;
  birthdate?: string;
  age?: number;

  // Relations enrichies
  role_details?: {
    role_uuid: string;
    role_name: string;
    role_created_at: Date;
  };

  // Timestamps
  created_at?: string;
  updated_at?: string;
}

// ✅ INTERFACE POUR CRÉATION D'UTILISATEUR
export interface CreateUserRequest {
  user_firstname: string;
  user_lastname: string;
  user_mail: string;
  user_password: string;
  user_birthdate?: string;
  user_isactive?: boolean;
  role_uuid: string;
}

// ✅ INTERFACE POUR MISE À JOUR D'UTILISATEUR
export interface UpdateUserRequest {
  user_firstname?: string;
  user_lastname?: string;
  user_mail?: string;
  user_password?: string;
  user_birthdate?: string;
  user_isactive?: boolean;
  role_uuid?: string;
}

// ✅ INTERFACE POUR L'AFFICHAGE SIMPLIFIÉ
export interface UserDisplayInfo {
  user_uuid: string;
  user_firstname: string;
  user_lastname: string;
  user_mail: string;
  fullName: string;
  
  id: string | number;
  firstname: string;
  lastname: string;
  email: string;
  
  role?: {
    role_name: string;
  };
}

// ✅ TYPES UTILITAIRES
export interface UserFilters {
  user_firstname?: string;
  user_lastname?: string;
  user_mail?: string;
  role_uuid?: string;
  user_isactive?: boolean;
}

export type UserSortField =
  | 'user_lastname'
  | 'user_firstname'
  | 'user_mail'
  | 'user_created_at';

export interface UserSortConfig {
  field: UserSortField;
  direction: 'asc' | 'desc';
}

export interface UserListConfig {
  page: number;
  pageSize: number;
  sort?: UserSortConfig;
  filters?: UserFilters;
}
