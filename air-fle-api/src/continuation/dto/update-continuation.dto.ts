import { PartialType } from '@nestjs/swagger';
import { CreateContinuationDto } from './create-continuation.dto';

export class UpdateContinuationDto extends PartialType(CreateContinuationDto) {}
