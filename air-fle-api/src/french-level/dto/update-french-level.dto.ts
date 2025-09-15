import { PartialType } from '@nestjs/swagger';
import { CreateFrenchLevelDto } from './create-french-level.dto';

export class UpdateFrenchLevelDto extends PartialType(CreateFrenchLevelDto) {}
