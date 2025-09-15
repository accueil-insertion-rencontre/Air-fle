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

    return {
      student_firstname: student.student_firstname,
      student_lastname: student.student_lastname,
      student_birthdate: student.student_birthdate,
      nationality: student.nationality
        ? {
            nationality_name: student.nationality.nationality_name,
          }
        : undefined,
    };
  }
}
