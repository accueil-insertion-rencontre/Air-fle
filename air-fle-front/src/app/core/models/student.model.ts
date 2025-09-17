// ✅ INTERFACE STUDENT UNIQUE - BASÉE SUR SCHÉMA PRISMA
export interface Student {
  student_uuid: string;
  student_firstname: string;
  student_lastname: string;
  student_birthdate: string;
  student_place_of_birth?: string;
  student_mail?: string;
  student_phone?: string;
  student_date_test_initial?: string;
  student_date_entry_france?: string;
  student_date_residence_permit?: string;
  student_date_cir?: string;
  student_commentary?: string;
  student_created_at: string;
  student_updated_at?: string;

  // IDs de référence directs (schéma réel)
  gender_uuid: string;
  french_level_uuid: string;
  nationality_uuid?: string;
  financing_uuid: string;
  status_uuid: string;
  orientation_uuid?: string;
  exit_reason_uuid?: string;

  // Relations avec objets complets (inclus par Prisma)
  gender?: {
    gender_uuid: string;
    gender_label: string;
    gender_created_at?: string;
  };
  frenchLevel?: {
    french_level_uuid: string;
    french_level_code: string;
    french_level_description: string;
    french_level_created_at?: string;
  };
  status?: {
    status_uuid: string;
    status_label: string;
    status_created_at?: string;
  };
  nationality?: {
    nationality_uuid: string;
    nationality_label: string;
    nationality_created_at?: string;
  };
  nationalities?: Array<{
    nationality?: {
      nationality_uuid: string;
      nationality_label: string;
      nationality_created_at?: string;
    };
    nationality_label?: string; // Fallback si structure directe
  }>;
  disabilities?: Array<{
    disability?: {
      disability_uuid: string;
      disability_label: string;
      disability_description?: string;
      disability_created_at?: string;
    };
    disability_uuid?: string; // Fallback si structure directe
  }>;
  financing?: {
    financing_uuid: string;
    financing_type: string;
    financing_created_at?: string;
  };
  orientation?: {
    orientation_uuid: string;
    orientation_type: string;
    orientation_description: string;
    orientation_created_at?: string;
  };
  exitReason?: {
    exit_reason_uuid: string;
    exit_reason_label: string;
    exit_reason_created_at?: string;
  };
  
  // Collections
  exit_levels?: {
    french_level_uuid: string;
    french_level_code: string;
    french_level_description: string;
    french_level_created_at?: string;
  }[];
  // Note: le back renvoie student.addresses[] (table de jointure) avec un objet imbriqué "address"
  addresses?: {
    address_uuid: string;
    address: {
      address_uuid: string;
      adress_street: string;
      adress_compladress?: string | null;
      adress_zipcode: number;
      adress_city: string;
    };
  }[];
  groups?: {
    group_uuid: string;
    group_label: string;
    group_created_at?: string;
  }[];
  
  // ✅ PROPRIÉTÉS DE COMPATIBILITÉ TEMPORAIRES
  id?: string; // Alias pour student_uuid
  firstname?: string; // Alias pour student_firstname
  lastname?: string; // Alias pour student_lastname
  email?: string; // Alias pour student_mail
  phone?: string; // Alias pour student_phone
}

// ✅ INTERFACE POUR CRÉATION D'ÉTUDIANT
export interface CreateStudentRequest {
  student_firstname: string;
  student_lastname: string;
  student_birthdate: Date;
  student_place_of_birth?: string;
  student_mail?: string;
  student_phone?: number;
  student_date_test_initial?: Date;
  student_date_entry_france?: Date;
  student_date_residence_permit?: Date;
  student_date_cir?: Date;
  student_commentary?: string;
  
  // IDs obligatoires
  gender_uuid: string;
  french_level_uuid: string;
  nationality_uuid?: string;
  financing_uuid: string;
  status_uuid: string;
  orientation_uuid?: string;
  exit_reason_uuid?: string;
  
  // Handicaps
  disability_uuids?: string[];
}

// ✅ TYPES UTILITAIRES
export interface StudentFilters {
  student_firstname?: string;
  student_lastname?: string;
  student_mail?: string;
  french_level_uuid?: string;
  status_uuid?: string;
  nationality_uuid?: string;
  group_uuid?: string;
  financing_uuid?: string;
  orientation_uuid?: string;
  search?: string;
}

export type StudentSortField =
  | 'student_lastname'
  | 'student_firstname'
  | 'student_mail'
  | 'student_created_at';

export interface StudentSortConfig {
  field: StudentSortField;
  direction: 'asc' | 'desc';
}

export interface StudentListConfig {
  page: number;
  pageSize: number;
  sort?: StudentSortConfig;
  filters?: StudentFilters;
}

export interface StudentListResponse {
  students: Student[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
