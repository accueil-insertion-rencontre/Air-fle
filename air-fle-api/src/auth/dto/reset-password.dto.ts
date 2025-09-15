import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordRequestDto {
  @ApiProperty({
    description: "Email de l'utilisateur",
    example: 'utilisateur@exemple.com',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordConfirmDto {
  @ApiProperty({
    description: 'Token de réinitialisation reçu par email',
    example: 'a1b2c3d4e5f6',
    required: true,
  })
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Nouveau mot de passe (minimum 8 caractères)',
    example: 'NouveauMotDePasse123!',
    required: true,
    minLength: 8,
  })
  @IsNotEmpty()
  password: string;
}
