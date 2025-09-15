import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Schedule } from '../models/course.model';
import { CourseService } from './course.service';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  constructor(
    private courseService: CourseService,
    private sessionService: SessionService
  ) {}

  // Récupérer tous les événements pour le calendrier
  getCalendarEvents(start: Date, end: Date): Observable<Schedule[]> {
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    
    return forkJoin({
      courses: this.courseService.getCoursesByDateRange(startStr, endStr),
      sessions: this.sessionService.getSessionsByDateRange(start, end),
    }).pipe(
      map(result => {
        // Convertir les cours en événements
        const courseEvents: Schedule[] = result.courses.map(course => ({
          id: course.course_id || course.id,
          title: course.intitule || course.title || 'Cours',
          start: new Date(`${course.day}T${course.start_hour}`),
          end: new Date(`${course.day}T${course.end_hour}`),
          courseId: course.course_id || course.id,
          groupId: course.group_id,
          color: '#28a745',
          allDay: false,
        }));

        // Convertir les sessions en événements pour le calendrier
        const sessionEvents: Schedule[] = result.sessions.map(session => ({
          id: session.session_uuid || session.id,
          title: session.session_label || session.label || 'Session',
          start: (session.session_started_at || session.started_at) ? new Date(session.session_started_at || session.started_at!) : new Date(),
          end: (session.session_finished_at || session.finished_at) ? new Date(session.session_finished_at || session.finished_at!) : new Date(),
          sessionId: session.session_uuid || session.id,
          color: '#3788d8',
          allDay: true,
        }));

        return [...courseEvents, ...sessionEvents];
      })
    );
  }

  // Mettre à jour un événement après drag & drop
  updateEventTimes(event: Schedule): Observable<any> {
    if (event.courseId && event.courseId !== undefined) {
      // C'est un cours
      return this.courseService.getCourseById(event.courseId).pipe(
        map(course => {
          const updatedCourse = {
            ...course,
            day: event.start.toISOString().split('T')[0],
            start_hour: event.start.toTimeString().slice(0, 5), // HH:MM format
            end_hour: event.end.toTimeString().slice(0, 5),
          };
          // updateCourse attend 2 paramètres: id et course
          return this.courseService.updateCourse(event.courseId!, updatedCourse);
        })
      );
    } else if (event.sessionId && event.sessionId !== undefined) {
      // C'est une session
      return this.sessionService.getSessionById(event.sessionId as number).pipe(
        map(session => {
          const updatedSession = {
            ...session,
            session_started_at: event.start,
            session_finished_at: event.end,
          };
          // updateSession attend 2 paramètres: id et session
          return this.sessionService.updateSession(event.sessionId!, updatedSession);
        })
      );
    }

    return of(null);
  }

  // Vérifier les conflits d'horaires
  checkScheduleConflicts(event: Schedule, events: Schedule[]): boolean {
    // Exclure l'événement lui-même s'il est déjà dans la liste
    const otherEvents = events.filter(
      e =>
        e.id !== event.id &&
        (e.groupId === event.groupId || // Même groupe
          (!e.allDay && !event.allDay)) // Cours (pas des sessions)
    );

    // Vérifier les chevauchements
    return otherEvents.some(e => {
      return event.start < e.end && event.end > e.start;
    });
  }
}
