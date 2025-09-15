import { Module } from '@nestjs/common';
import { NationalityController } from './nationality.controller';
import { NationalityService } from './nationality.service';
import { NationalityRepository } from './nationality.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NationalityController],
  providers: [NationalityService, NationalityRepository],
  exports: [NationalityService],
})
export class NationalityModule {}
