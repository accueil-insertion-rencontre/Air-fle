import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { Escape } from 'class-sanitizer';

export class CreateDisabilityDto {
  @ApiProperty({
    description: 'Libellé du handicap',
    example: 'Moteur',
  })
  @IsString()
  @Escape()
  disability_label: string;

  @ApiProperty({
    description: 'Description détaillée du handicap',
    example: 'Handicap affectant la mobilité et les fonctions motrices',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Escape()
  disability_description?: string;
}
