import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional, IsArray } from 'class-validator';
import { CreateStudentExamDto } from './create-student-exam.dto';

export class CreateExamDto {
  @ApiProperty({
    description: "Label de l'examen",
    example: 'Examen de français - Niveau A1',
  })
  @IsString()
  exam_label: string;

  @ApiProperty({
    description: "Date de l'examen",
    example: '2024-01-15',
  })
  @IsDateString()
  exam_taked_at: string;

  @ApiProperty({
    description: "Type d'examen",
    example: 'written',
    enum: ['written', 'oral', 'practical'],
    default: 'written',
  })
  @IsOptional()
  @IsString()
  exam_type?: string;

  @ApiProperty({
    description: 'Liste des étudiants avec leurs scores',
    type: [CreateStudentExamDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  students?: CreateStudentExamDto[];
}
