import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { Escape } from 'class-sanitizer';

export class CreateFrenchLevelDto {
  @ApiProperty({
    description: 'Code du niveau de français',
    example: 'A1',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  @Escape()
  code?: string;

  @ApiProperty({
    description: 'Description du niveau de français',
    example: 'Niveau débutant',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  @Escape()
  description?: string;
}
