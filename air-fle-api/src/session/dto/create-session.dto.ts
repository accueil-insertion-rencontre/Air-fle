import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Escape } from 'class-sanitizer';

export class CreateSessionDto {
  @ApiProperty({
    description: 'Libellé de la session',
    example: "Session d'été 2023",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Escape()
  session_label?: string;

  @ApiProperty({
    description: 'Date de début de la session',
    example: '2023-06-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  session_started_at: string | Date;

  @ApiProperty({
    description: 'Date de fin de la session',
    example: '2023-08-31T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  session_finished_at: string | Date;
}
