import { Schedule } from '@core/models';

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import {
  CalendarOptions,
  EventApi,
  EventClickArg,
  EventDropArg,
  EventInput,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarService } from '@core/services';

@Component({
  selector: 'app-session-calendar',
  templateUrl: './session-calendar.component.html',
  styleUrls: ['./session-calendar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FullCalendarModule],
})
export class SessionCalendarComponent implements OnInit {
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    eventClick: this.handleEventClick.bind(this),
    eventDrop: this.handleEventDrop.bind(this),
    events: [],
    locale: 'fr',
    firstDay: 1, // Lundi comme premier jour de la semaine
    buttonText: {
      today: "Aujourd'hui",
      month: 'Mois',
      week: 'Semaine',
      day: 'Jour',
    },
  };

  events: EventInput[] = [];
  currentEvents: EventApi[] = [];
  loading = true;

  constructor(private calendarService: CalendarService) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    const start = new Date();
    start.setMonth(start.getMonth() - 1); // Charger à partir d'un mois avant

    const end = new Date();
    end.setMonth(end.getMonth() + 3); // Jusqu'à 3 mois après

    this.loading = true;

    this.calendarService.getCalendarEvents(start, end).subscribe({
      next: events => {
        this.events = events.map(event => ({
          id: event.id?.toString(),
          title: event.title,
          start: event.start,
          end: event.end,
          color: event.color,
          allDay: event.allDay,
          extendedProps: {
            sessionId: event.sessionId,
            courseId: event.courseId,
            groupId: event.groupId,
          },
        }));

        this.calendarOptions.events = this.events;
        this.loading = false;
      },
      error: (err: Error) => {
        // console.error('Erreur lors du chargement des événements du calendrier', err);
        this.loading = false;
      },
    });
  }

  handleEventClick(clickInfo: EventClickArg): void {
    if (clickInfo.event.extendedProps['sessionId']) {
      // Navigation vers le détail de la session
      // this.router.navigate(['/dashboard/sessions', clickInfo.event.extendedProps['sessionId']]);
      
    } else if (clickInfo.event.extendedProps['courseId']) {
      // Navigation vers le détail du cours
      // this.router.navigate(['/dashboard/courses', clickInfo.event.extendedProps['courseId']]);
      
    }
  }

  handleEventDrop(dropInfo: EventDropArg): void {
    const eventId = parseInt(dropInfo.event.id);

    // Créer un nouvel objet Schedule avec les nouvelles dates
    const updatedEvent: Schedule = {
      id: eventId,
      title: dropInfo.event.title,
      start: dropInfo.event.start!,
      end: dropInfo.event.end!,
      allDay: dropInfo.event.allDay,
      sessionId: dropInfo.event.extendedProps['sessionId'],
      courseId: dropInfo.event.extendedProps['courseId'],
      groupId: dropInfo.event.extendedProps['groupId'],
    };

    // Vérifier les conflits
    const conflicting = this.calendarService.checkScheduleConflicts(
      updatedEvent,
      this.events.map(
        e =>
          ({
            id: parseInt(e.id as string) || 0,
            title: e.title as string,
            start: e.start as Date,
            end: e.end as Date,
            allDay: !!e.allDay,
            sessionId: e.extendedProps?.['sessionId'],
            courseId: e.extendedProps?.['courseId'],
            groupId: e.extendedProps?.['groupId'],
          }) as Schedule
      )
    );

    if (conflicting) {
      alert('Conflit détecté ! Ce créneau est déjà occupé.');
      dropInfo.revert();
      return;
    }

    // Mettre à jour l'événement
    this.calendarService.updateEventTimes(updatedEvent).subscribe({
      next: () => {

      },
      error: (err: Error) => {
        // console.error("Erreur lors de la mise à jour de l'événement", err);
        dropInfo.revert();
      },
    });
  }
}
