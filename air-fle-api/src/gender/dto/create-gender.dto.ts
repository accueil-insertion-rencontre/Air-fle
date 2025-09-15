import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { Escape } from 'class-sanitizer';

export class CreateGenderDto {
  @ApiProperty({
    description: 'Libellé du genre',
    example: 'Masculin',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Escape()
  gender_label: string;
}
