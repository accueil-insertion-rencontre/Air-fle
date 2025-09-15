import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateContinuationDto {
  @ApiProperty({
    description: 'Temporalité de la continuation (ex: "3 mois", "6 mois")',
    example: '3 mois',
    required: false,
  })
  @IsOptional()
  @IsString()
  continuation_temporality?: string | null;

  @ApiProperty({
    description: 'Commentaire sur la continuation (max 50 caractères)',
    example: "Continuation approuvée pour l'année scolaire",
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, {
    message: 'Le commentaire ne peut pas dépasser 50 caractères',
  })
  continuation_commentary?: string | null;

  @ApiProperty({
    description: "UUID de l'étudiant associé à la continuation",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  student_uuid: string;
}
