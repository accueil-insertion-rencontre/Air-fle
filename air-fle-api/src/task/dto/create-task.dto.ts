import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDate,
  IsDateString,
  MaxLength,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  ArrayMinSize,
} from 'class-validator';
import { Escape } from 'class-sanitizer';
import { Type } from 'class-transformer';
import { CreateSubtaskDto } from './create-subtask.dto';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export class CreateTaskDto {
  @ApiProperty({
    description: 'Titre de la tâche',
    example: 'Préparation du cours A1',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Escape()
  title: string;

  @ApiProperty({
    description: 'Description de la tâche',
    example: 'Préparer le support de cours pour le niveau A1',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Escape()
  description?: string;

  @ApiProperty({
    description:
      'Pourcentage de completion de la tâche (calculé automatiquement)',
    example: 0,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  completionPercentage?: number;

  @ApiProperty({
    description: "Date d'échéance de la tâche",
    example: '2023-12-31T00:00:00.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dueAt?: string | Date;

  @ApiProperty({
    description:
      'Liste des sous-tâches à créer avec la tâche (obligatoire - au moins 1)',
    type: [CreateSubtaskDto],
    required: true,
  })
  @IsArray()
  @IsNotEmpty()
  @ArrayMinSize(1, { message: 'Une tâche doit avoir au moins une sous-tâche' })
  @ValidateNested({ each: true })
  @Type(() => CreateSubtaskDto)
  subtasks: CreateSubtaskDto[];
}
