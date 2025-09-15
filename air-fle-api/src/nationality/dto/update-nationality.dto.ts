import { PartialType } from '@nestjs/swagger';
import { CreateNationalityDto } from './create-nationality.dto';

export class UpdateNationalityDto extends PartialType(CreateNationalityDto) {}
