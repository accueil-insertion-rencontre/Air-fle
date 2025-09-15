import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Escape } from 'class-sanitizer';

export class CreateExitReasonDto {
  @ApiProperty({
    description: 'Raison de sortie',
    example: 'Fin de formation',
  })
  @IsString()
  @Escape()
  reason: string;
}
