import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { GroupRepository } from './repositories/group.repository';
import { GroupStudentManagerService } from './services/group-student-manager.service';
import { PrismaModule } from '../prisma/prisma.module';
import {
  GROUP_REPOSITORY,
  GROUP_STUDENT_MANAGER,
} from './interfaces/group.interface';

@Module({
  imports: [PrismaModule],
  controllers: [GroupController],
  providers: [
    GroupService,
    {
      provide: GROUP_REPOSITORY,
      useClass: GroupRepository,
    },
    {
      provide: GROUP_STUDENT_MANAGER,
      useClass: GroupStudentManagerService,
    },
  ],
  exports: [GroupService],
})
export class GroupModule {}
