export type NewAttendanceStatus = 'present' | 'absent' | 'justified' | 'late';

export interface AttendanceStudentInput {
  student_uuid: string;
  status: NewAttendanceStatus;
  notes?: string;
}

export interface AttendancePostBody {
  students: AttendanceStudentInput[];
}
