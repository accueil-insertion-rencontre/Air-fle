// Interface de base pour tous les éléments de référence
export interface BaseReferenceItem {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

// Nationalités
export interface Nationality extends BaseReferenceItem {
  label: string;
}

// Niveaux de français
export interface FrenchLevel extends BaseReferenceItem {
  code: string;
  description: string;
}

// Niveaux pour les filtres (compatibilité)
export interface Level {
  code: string;
  name: string;
  description: string;
  order: number;
}

export const LEVELS: Level[] = [
  { code: 'A1', name: 'Débutant', description: 'Niveau introductif ou découverte', order: 1 },
  { code: 'A2', name: 'Intermédiaire', description: 'Niveau intermédiaire ou de survie', order: 2 },
  { code: 'B1', name: 'Seuil', description: 'Niveau seuil', order: 3 },
  { code: 'B2', name: 'Avancé', description: 'Niveau avancé ou indépendant', order: 4 },
  { code: 'C1', name: 'Autonome', description: 'Niveau autonome', order: 5 },
  { code: 'C2', name: 'Maîtrise', description: 'Niveau maîtrise', order: 6 },
];

// Genres
export interface Gender extends BaseReferenceItem {
  label: string;
}

// Raisons de sortie
export interface ExitReason extends BaseReferenceItem {
  reason: string; // Mappé depuis exit_reason du backend
}

// Orientations
export interface Orientation extends BaseReferenceItem {
  type: string;
  description?: string;
}

// Statuts
export interface Status extends BaseReferenceItem {
  label: string;
}

// Financements
export interface Financing extends BaseReferenceItem {
  type: string;
}

// Handicaps
export interface Disability extends BaseReferenceItem {
  label: string;
  description?: string;
}

// Types pour les opérations CRUD
export interface CreateNationalityDto {
  label: string;
}

export interface CreateFrenchLevelDto {
  code: string;
  description: string;
}

export interface CreateGenderDto {
  label: string;
}

export interface CreateExitReasonDto {
  reason: string; // Sera mappé vers exit_reason côté backend
}

export interface CreateOrientationDto {
  type: string;
  description?: string;
}

export interface CreateStatusDto {
  label: string;
}

export interface CreateFinancingDto {
  type: string;
}

export interface CreateDisabilityDto {
  label: string;
  description?: string;
}

// Interface pour les réponses API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  statusCode: number;
}

// Enum pour les types de données de référence
export enum ReferenceDataType {
  NATIONALITIES = 'nationalities',
  FRENCH_LEVELS = 'french-levels',
  GENDERS = 'genders',
  EXIT_REASONS = 'exit-reasons',
  ORIENTATIONS = 'orientations',
  STATUSES = 'statuses',
  FINANCINGS = 'financings',
  DISABILITIES = 'disabilities',
}

// Configuration pour chaque type de données
export interface ReferenceDataConfig {
  type: ReferenceDataType;
  endpoint: string;
  displayName: string;
  icon: string;
  columns: { key: string; label: string; sortable?: boolean }[];
} 