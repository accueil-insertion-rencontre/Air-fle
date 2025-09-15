import { Module } from '@nestjs/common';
import { OrientationService } from './orientation.service';
import { OrientationController } from './orientation.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrientationController],
  providers: [OrientationService],
  exports: [OrientationService],
})
export class OrientationModule {}
