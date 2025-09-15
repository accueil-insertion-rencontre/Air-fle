import { Injectable } from '@nestjs/common';
import { StudentService } from '../../student/student.service';
import {
  IStudentDataProvider,
  StudentBasicInfo,
} from '../interfaces/document-generator.interface';

@Injectable()
export class StudentDataAdapter implements IStudentDataProvider {
  constructor(private readonly studentService: StudentService) {}

  async getBasicInfo(uuid: string): Promise<StudentBasicInfo> {
    const student = await this.studentService.findOne({ student_uuid: uuid });

    if (!student) {
      throw new Error(`Student with UUID ${uuid} not found`);
    }

    const typedStudent = student as typeof student & {
      nationality?: { nationality_name: string };
    };

    return {
      student_firstname: typedStudent.student_firstname,
      student_lastname: typedStudent.student_lastname,
      student_birthdate: typedStudent.student_birthdate,
      nationality: typedStudent.nationality
        ? {
            nationality_name: typedStudent.nationality.nationality_name,
          }
        : undefined,
    };
  }
}
