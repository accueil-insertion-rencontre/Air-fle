import { PartialType } from '@nestjs/swagger';
import { CreateStudentExamDto } from './create-student-exam.dto';

export class UpdateStudentExamDto extends PartialType(CreateStudentExamDto) {}
