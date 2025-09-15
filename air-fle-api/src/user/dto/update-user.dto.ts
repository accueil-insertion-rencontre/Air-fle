import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['user_password'] as const),
) {
  @ApiProperty({
    description: 'Nouveau mot de passe (minimum 6 caractères)',
    example: 'newPassword123',
    required: false,
    minLength: 6,
  })
  @IsString()
  @IsOptional()
  @MinLength(6)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/, {
    message:
      'Le mot de passe ne doit contenir que des caractères alphanumériques et certains caractères spéciaux',
  })
  user_password?: string;
}
