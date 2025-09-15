import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { Escape } from 'class-sanitizer';

export class CreateFinancingDto {
  @ApiProperty({
    description: 'Type de financement',
    example: 'Pôle Emploi',
  })
  @IsString()
  @IsNotEmpty()
  @Escape()
  financing_type: string;
}
