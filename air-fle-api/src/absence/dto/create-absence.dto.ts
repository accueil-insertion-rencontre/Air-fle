import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional } from 'class-validator';
import { Escape } from 'class-sanitizer';

export class CreateAbsenceDto {
  @ApiProperty({
    description: "UUID de l'étudiant",
    example: 'def456',
    required: true,
  })
  @IsUUID(4)
  student_uuid: string;

  @ApiProperty({
    description: 'UUID du cours',
    example: 'ghi789',
    required: true,
  })
  @IsUUID(4)
  course_uuid: string;

  @ApiProperty({
    description: "Raison de l'absence",
    example: 'Maladie',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Escape()
  absence_reason?: string;
}
