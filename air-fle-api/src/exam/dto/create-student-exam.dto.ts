import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateStudentExamDto {
  @ApiProperty({
    description: "UUID de l'étudiant",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  student_uuid: string;

  @ApiProperty({
    description: "UUID de l'examen",
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  exam_uuid: string;

  @ApiProperty({
    description: "Score de l'examen",
    example: '15/20',
    required: false,
  })
  @IsOptional()
  @IsString()
  exam_score?: string;

  @ApiProperty({
    description: "Statut de l'examen",
    example: 'passed',
    enum: ['passed', 'failed', 'absent', 'pending'],
    default: 'pending',
  })
  @IsOptional()
  @IsString()
  exam_status?: string;

  @ApiProperty({
    description: "Notes sur l'examen",
    example: 'Très bon travail',
    required: false,
  })
  @IsOptional()
  @IsString()
  exam_notes?: string;
}
