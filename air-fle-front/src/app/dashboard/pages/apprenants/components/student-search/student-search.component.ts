import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentFilters } from '@core/models';

@Component({
  selector: 'app-student-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-search.component.html',
  styleUrls: ['./student-search.component.scss'],
})
export class StudentSearchComponent {
  @Input() maxHistoryItems = 5;
  @Output() search = new EventEmitter<string>();
  @Output() filtersChange = new EventEmitter<StudentFilters>();

  searchValue = '';
  showFilters = false;
  searchHistory: string[] = [];
  filters: StudentFilters = {
    firstName: '',
    lastName: '',
    email: '',
    level: '',
    status: '',
    nationality: '',
  };

  onSearchChange(value: string): void {
    this.search.emit(value);
    if (value.trim()) {
      this.addToHistory(value.trim());
    }
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

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

  private addToHistory(term: string): void {
    if (!this.searchHistory.includes(term)) {
      this.searchHistory.unshift(term);
      if (this.searchHistory.length > this.maxHistoryItems) {
        this.searchHistory.pop();
      }
    }
  }

  applyHistoryTerm(term: string): void {
    this.searchValue = term;
    this.search.emit(term);
  }

  removeFromHistory(term: string, event: Event): void {
    event.stopPropagation();
    this.searchHistory = this.searchHistory.filter(t => t !== term);
  }
}
