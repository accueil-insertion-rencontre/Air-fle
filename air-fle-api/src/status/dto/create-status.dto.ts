import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { Escape } from 'class-sanitizer';

export class CreateStatusDto {
  @ApiProperty({
    description: 'Libellé du statut',
    example: 'Actif',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Escape()
  status_label: string;
}
