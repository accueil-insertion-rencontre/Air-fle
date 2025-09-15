import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { Escape } from 'class-sanitizer';

export class CreateOrientationDto {
  @ApiProperty({
    description: "Type d'orientation",
    example: 'Professionnelle',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Escape()
  orientation_type: string;

  @ApiProperty({
    description: "Description de l'orientation",
    example: 'Orientation vers une formation professionnelle',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  @Escape()
  orientation_description?: string;
}
