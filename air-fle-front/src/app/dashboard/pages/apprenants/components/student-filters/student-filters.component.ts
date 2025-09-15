import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentFilters } from '@core/models';
import { Level, Status, Nationality } from '@core/models';

@Component({
  selector: 'app-student-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-filters.component.html',
  styleUrls: ['./student-filters.component.scss'],
})
export class StudentFiltersComponent {
  @Input() levels: Level[] = [];
  @Input() statuses: Status[] = [];
  @Input() nationalities: Nationality[] = [];
  @Output() filtersChange = new EventEmitter<StudentFilters>();

  filters: StudentFilters = {
    firstName: '',
    lastName: '',
    email: '',
    level: '',
    status: '',
    nationality: '',
  };

  onFiltersChange(): void {
    this.filtersChange.emit(this.filters);
  }

  clearFilters(): void {
    this.filters = {
      firstName: '',
      lastName: '',
      email: '',
      level: '',
      status: '',
      nationality: '',
    };
    this.filtersChange.emit(this.filters);
  }
}
