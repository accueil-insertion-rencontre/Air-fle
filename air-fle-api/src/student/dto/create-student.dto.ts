import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsUUID,
  IsOptional,
  MaxLength,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Escape } from 'class-sanitizer';

export class CreateStudentDto {
  @ApiProperty({
    description: "Prénom de l'étudiant",
    example: 'Jean',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Escape()
  student_firstname: string;

  @ApiProperty({
    description: "Nom de l'étudiant",
    example: 'Dupont',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Escape()
  student_lastname: string;

  @ApiProperty({
    description: 'Date de naissance (format ISO)',
    example: '1990-01-01',
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  student_birthdate: Date;

  @ApiProperty({
    description: 'Lieu de naissance',
    example: 'Paris',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Escape()
  student_place_of_birth?: string;

  @ApiProperty({
    description: "Email de l'étudiant",
    example: 'jean.dupont@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  @MaxLength(50)
  student_mail?: string;

  @ApiProperty({
    description: 'Numéro de téléphone',
    example: '07533982997',
    required: false,
  })
  @IsOptional()
  @IsString()
  student_phone?: string;

  @ApiProperty({
    description: 'Date du test initial',
    example: '2023-01-01',
    required: false,
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  student_date_test_initial?: Date;

  @ApiProperty({
    description: 'Commentaire',
    example: 'Très motivé',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Escape()
  student_commentary?: string;

  @ApiProperty({
    description: "Date d'entrée en France",
    example: '2022-01-15',
    required: false,
    type: Date,
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  student_date_entry_france?: Date;

  @ApiProperty({
    description: 'Date de création',
    example: '2023-01-01',
    required: false,
    type: Date,
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  student_created_at?: Date;

  @ApiProperty({
    description: 'Date de mise à jour',
    example: '2023-01-01',
    required: false,
    type: Date,
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  student_updated_at?: Date;

  @ApiProperty({
    description: "Date du Contrat d'Intégration Républicaine",
    example: '2022-03-01',
    required: false,
    type: Date,
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  student_date_cir?: Date;

  @ApiProperty({
    description: 'Date du titre de séjour',
    example: '2022-04-01',
    required: false,
    type: Date,
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  student_date_residence_permit?: Date;

  @ApiProperty({
    description: 'UUID du genre',
    example: 'c35fe727-d68e-4b1e-afe1-c5618ccf2cce',
  })
  @IsUUID(4)
  @IsNotEmpty()
  gender_uuid: string;

  @ApiProperty({
    description: 'UUID du niveau de français initial',
    example: 'f54480bd-4893-41d6-831d-f6eb81dffce6',
  })
  @IsUUID(4)
  @IsNotEmpty()
  french_level_uuid: string;

  @ApiProperty({
    description: 'UUID de la nationalité',
    example: 'b1ab0950-a5fc-445a-851f-8060124d31c2',
  })
  @IsUUID(4)
  @IsNotEmpty()
  nationality_uuid: string;

  @ApiProperty({
    description: 'UUID du financement',
    example: '471f401a-c78f-46de-8608-161f17912df0',
  })
  @IsUUID(4)
  @IsNotEmpty()
  financing_uuid: string;

  @ApiProperty({
    description: 'UUID du statut',
    example: 'da2fa9b7-388e-4873-a542-1a22f95a27af',
  })
  @IsUUID(4)
  @IsNotEmpty()
  status_uuid: string;

  @ApiProperty({
    description: "UUID de l'orientation",
    example: '471f401a-c78f-46de-8608-161f17912df0',
    required: false,
  })
  @IsUUID(4)
  @IsOptional()
  orientation_uuid?: string;

  @ApiProperty({
    description: 'UUID de la raison de sortie',
    example: 'da2fa9b7-388e-4873-a542-1a22f95a27af',
    required: false,
  })
  @IsUUID(4)
  @IsOptional()
  exit_reason_uuid?: string;
}
