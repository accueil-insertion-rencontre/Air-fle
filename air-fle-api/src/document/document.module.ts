import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { StudentModule } from '../student/student.module';
import { StudentDataAdapter } from './adapters/student-data.adapter';
import { STUDENT_DATA_PROVIDER } from './interfaces/document-generator.interface';

@Module({
  imports: [StudentModule, JwtModule],
  controllers: [DocumentController],
  providers: [
    DocumentService,
    {
      provide: STUDENT_DATA_PROVIDER,
      useClass: StudentDataAdapter,
    },
  ],
  exports: [DocumentService],
})
export class DocumentModule {}
