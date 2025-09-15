import { Module } from '@nestjs/common';
import { FrenchLevelController } from './french-level.controller';
import { FrenchLevelService } from './french-level.service';
import { FrenchLevelRepository } from './french-level.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FrenchLevelController],
  providers: [FrenchLevelService, FrenchLevelRepository],
  exports: [FrenchLevelService],
})
export class FrenchLevelModule {}
