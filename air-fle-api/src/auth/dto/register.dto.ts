import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsBoolean,
  IsISO8601,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Escape } from 'class-sanitizer';

export class RegisterDto {
  @ApiProperty({
    description: "Prénom de l'utilisateur",
    example: 'Jean',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Escape()
  @Matches(
    /^[a-zA-Z0-9\s\-'àáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆŠŽ]+$/,
    {
      message:
        'Le prénom ne doit contenir que des caractères alphanumériques et des caractères spéciaux autorisés',
    },
  )
  firstname: string;

  @ApiProperty({
    description: "Nom de l'utilisateur",
    example: 'Dupont',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Escape()
  @Matches(
    /^[a-zA-Z0-9\s\-'àáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆŠŽ]+$/,
    {
      message:
        'Le nom ne doit contenir que des caractères alphanumériques et des caractères spéciaux autorisés',
    },
  )
  lastname: string;

  @ApiProperty({
    description: "Email de l'utilisateur",
    example: 'jean.dupont@example.com',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'Mot de passe (minimum 6 caractères)',
    example: 'password123',
    required: true,
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/, {
    message:
      'Le mot de passe ne doit contenir que des caractères alphanumériques et certains caractères spéciaux',
  })
  password: string;

  @ApiProperty({
    description: "Date de naissance de l'utilisateur (format ISO 8601)",
    example: '1990-01-01',
    required: false,
  })
  @IsOptional()
  @IsISO8601()
  birthdate?: string;

  @ApiProperty({
    description: 'Statut du compte (actif/inactif)',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
