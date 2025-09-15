import { PartialType, OmitType, ApiProperty } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';

export class UpdateTaskDto extends PartialType(
  OmitType(CreateTaskDto, ['subtasks'] as const),
) {
  @ApiProperty({
    description: 'Statut de la tâche (0-100)',
    example: 50,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  status?: number;
}
