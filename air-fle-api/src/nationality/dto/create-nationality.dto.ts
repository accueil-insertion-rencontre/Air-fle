import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { Escape } from 'class-sanitizer';

export class CreateNationalityDto {
  @ApiProperty({
    description: 'Libellé de la nationalité',
    example: 'Française',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Escape()
  nationality_label: string;
}
