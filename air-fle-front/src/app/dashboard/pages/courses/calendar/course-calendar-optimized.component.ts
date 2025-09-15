import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';

// 🔥 AVANT : Imports horrifiques
// import { CourseService } from '@core/services';
// import { SessionService } from '@core/services';
// import { GroupService } from '@core/services';
// import { UserService } from '@core/services';
// import { AttendanceService, AttendanceRecord, AttendanceStatus } from '@core/services';
// import { AlertService } from '@core/services';
// import { Course } from '@core/models';
// import { Session } from '@core/models';
// import { Group } from '@core/models';
// import { Student } from '@core/models';
// import { User, UserDisplayInfo } from '@core/models';
// import { environment } from '@environments/environment';

// 🔥 APRÈS : Imports propres avec barrel exports
import {
  CourseService,
  SessionService,
  GroupService,
  UserService,
  AttendanceService,
  AttendanceRecord,
  AttendanceStatus,
  AlertService,
} from '@core/services';

import { Course, Session, Group, Student, User, UserDisplayInfo, Schedule } from '@core/models';

import { environment } from '@environments/environment';

declare var bootstrap: any;

interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
}

@Component({
  selector: 'app-course-calendar-optimized',
  templateUrl: './course-calendar.component.html',
  styleUrls: ['./course-calendar.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class CourseCalendarOptimizedComponent implements OnInit {
  // Le reste du composant reste identique...
  // Cette version montre juste l'amélioration des imports

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private sessionService: SessionService,
    private groupService: GroupService,
    private userService: UserService,
    private attendanceService: AttendanceService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    // Implémentation...
  }

  /**
   * TrackBy functions pour optimiser le rendu
   */
  trackByGroupId = (index: number, group: Group): string => {
    return group.group_id?.toString() || group.id?.toString() || index.toString();
  };

  trackByStudentId = (index: number, student: Student): number | string => {
    return student.student_id || student.student_uuid || index;
  };
}
