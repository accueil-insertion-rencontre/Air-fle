import { Module } from '@nestjs/common';
import { ExitReasonService } from './exit-reason.service';
import { ExitReasonController } from './exit-reason.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExitReasonController],
  providers: [ExitReasonService],
  exports: [ExitReasonService],
})
export class ExitReasonModule {}
