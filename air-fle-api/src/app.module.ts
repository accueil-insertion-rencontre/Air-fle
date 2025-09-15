import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { StudentModule } from './student/student.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CourseModule } from './course/course.module';
import { SessionModule } from './session/session.module';
import { AbsenceModule } from './absence/absence.module';
import { GroupModule } from './group/group.module';
import { NationalityModule } from './nationality/nationality.module';
import { FrenchLevelModule } from './french-level/french-level.module';
import { GenderModule } from './gender/gender.module';
import { AddressModule } from './address/address.module';
import { ExitReasonModule } from './exit-reason/exit-reason.module';
import { OrientationModule } from './orientation/orientation.module';
import { PeriodModule } from './period/period.module';
import { StatusModule } from './status/status.module';
import { FinancingModule } from './financing/financing.module';
import { ExamModule } from './exam/exam.module';
import { ContinuationModule } from './continuation/continuation.module';
import { TaskModule } from './task/task.module';
import { DisabilityModule } from './disability/disability.module';
import { DocumentModule } from './document/document.module';
import { HealthModule } from './health/health.module';
import { LoggingModule } from './logging/logging.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    StudentModule,
    AuthModule,
    UserModule,
    CourseModule,
    SessionModule,
    AbsenceModule,
    GroupModule,
    NationalityModule,
    FrenchLevelModule,
    GenderModule,
    AddressModule,
    ExitReasonModule,
    OrientationModule,
    PeriodModule,
    StatusModule,
    FinancingModule,
    ExamModule,
    ContinuationModule,
    TaskModule,
    DisabilityModule,
    DocumentModule,
    HealthModule,
    LoggingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
