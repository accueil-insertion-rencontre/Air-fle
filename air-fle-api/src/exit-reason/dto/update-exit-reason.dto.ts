import { PartialType } from '@nestjs/swagger';
import { CreateExitReasonDto } from './create-exit-reason.dto';

export class UpdateExitReasonDto extends PartialType(CreateExitReasonDto) {}
