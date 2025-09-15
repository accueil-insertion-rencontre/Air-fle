export const STUDENT_DATA_PROVIDER = Symbol('IStudentDataProvider');

export interface IDocumentGenerator {
  generate(data: Record<string, unknown>): Promise<Buffer>;
}

export interface IStudentDataProvider {
  getBasicInfo(uuid: string): Promise<StudentBasicInfo>;
}

// Historique désactivé

export interface StudentBasicInfo {
  student_firstname: string;
  student_lastname: string;
  student_birthdate: Date;
  nationality?: {
    nationality_name: string;
  };
}

export interface AttendanceRecord {
  learner_history_date: Date;
  status?: {
    status_name: string;
  };
}
