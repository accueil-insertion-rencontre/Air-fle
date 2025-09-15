import { PartialType } from '@nestjs/swagger';
import { CreateDisabilityDto } from './create-disability.dto';

export class UpdateDisabilityDto extends PartialType(CreateDisabilityDto) {}
