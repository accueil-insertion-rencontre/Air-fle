import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, MaxLength } from 'class-validator';
import { Escape } from 'class-sanitizer';

export class CreateGroupDto {
  @ApiProperty({
    description: 'Libellé du groupe',
    example: 'Groupe A1',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Escape()
  group_label: string;

  @ApiProperty({
    description: 'UUID de la session associée',
    example: 'e87b56a8-1234-5678-9abc-def012345678',
  })
  @IsUUID(4)
  @IsNotEmpty()
  session_uuid: string;
}
