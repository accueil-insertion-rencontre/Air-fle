import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { SubtaskService } from './subtask.service';
import { TaskController } from './task.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TaskController],
  providers: [TaskService, SubtaskService],
  exports: [TaskService, SubtaskService],
})
export class TaskModule {}
