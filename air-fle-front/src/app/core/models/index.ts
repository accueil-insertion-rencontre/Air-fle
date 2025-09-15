// Address model
export * from './address.model';

// Course model
export * from './course.model';

// Group model
export * from './group.model';

// Reference data model
export * from './reference-data.model';

// Session model
export * from './session.model';

// Student model
export * from './student.model';

// User model
export * from './user.model';

// Exam model
export * from './exam.model';

// Continuation model
export * from './continuation.model';

// Export types explicitly for better IDE support
export type { Address } from './address.model';
export type { Course } from './course.model';
export type { Group, CreateGroupRequest } from './group.model';
export type { Session, CreateSessionRequest } from './session.model';
export type { Exam, CreateExamDto, UpdateExamDto, ExamApiResponse, ExamDisplayInfo } from './exam.model';
export type { 
  Continuation,
  CreateContinuationDto,
  UpdateContinuationDto,
  ContinuationFilters,
  ContinuationStats
} from './continuation.model';

// API list response
export interface ApiListResponse<T> {
  data: T[];
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
}

export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

