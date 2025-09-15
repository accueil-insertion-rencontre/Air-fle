import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsIn,
} from 'class-validator';
import { Escape } from 'class-sanitizer';

export class CreateSubtaskDto {
  @ApiProperty({
    description: 'Titre de la sous-tâche',
    example: 'Réviser les verbes irréguliers',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Escape()
  title: string;

  @ApiProperty({
    description: 'Description de la sous-tâche',
    example: 'Revoir la liste des verbes irréguliers du niveau A1',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Escape()
  description?: string;

  @ApiProperty({
    description: 'Statut de la sous-tâche (pending ou completed uniquement)',
    enum: ['pending', 'completed'],
    example: 'pending',
    default: 'pending',
    required: false,
  })
  @IsIn(['pending', 'completed'])
  @IsOptional()
  status?: 'pending' | 'completed';
}
