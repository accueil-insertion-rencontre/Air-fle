import { Module } from '@nestjs/common';
import { ContinuationService } from './continuation.service';
import { ContinuationController } from './continuation.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContinuationController],
  providers: [ContinuationService],
  exports: [ContinuationService],
})
export class ContinuationModule {}
