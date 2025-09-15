import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { Escape } from 'class-sanitizer';

export class CreateAddressDto {
  @ApiProperty({
    description: 'Rue',
    example: '12 rue de Paris',
  })
  @IsString()
  @Escape()
  street: string;

  @ApiProperty({
    description: "Complément d'adresse",
    required: false,
    nullable: true,
    example: 'Appartement 4B',
  })
  @IsString()
  @IsOptional()
  @Escape()
  complement?: string | null;

  @ApiProperty({
    description: 'Code postal',
    example: 75001,
    type: Number,
  })
  @IsInt()
  @Type(() => Number)
  zipcode: number;

  @ApiProperty({
    description: 'Ville',
    example: 'Paris',
  })
  @IsString()
  @Escape()
  city: string;

  @ApiProperty({
    description: 'Pays',
    default: 'France',
    example: 'France',
  })
  @IsString()
  @IsOptional()
  @Escape()
  country?: string;
}
