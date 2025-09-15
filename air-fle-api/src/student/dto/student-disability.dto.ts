import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsArray } from 'class-validator';

export class StudentDisabilityDto {
  @ApiProperty({
    description: "Identifiants des types de handicap à associer à l'étudiant",
    example: [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
    ],
    type: [String],
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  disability_ids: string[];
}
