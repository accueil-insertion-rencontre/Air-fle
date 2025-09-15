import { Module } from '@nestjs/common';
import { DisabilityService } from './disability.service';
import { DisabilityController } from './disability.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DisabilityController],
  providers: [DisabilityService],
  exports: [DisabilityService],
})
export class DisabilityModule {}
