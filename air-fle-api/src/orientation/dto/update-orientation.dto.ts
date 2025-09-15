import { PartialType } from '@nestjs/swagger';
import { CreateOrientationDto } from './create-orientation.dto';

export class UpdateOrientationDto extends PartialType(CreateOrientationDto) {}
