import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StudentService, ReferenceDataService, ReferenceData } from '@core/services';

@Component({
  selector: 'app-student-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-import.component.html',
  styleUrls: ['./student-import.component.scss'],
})
export class StudentImportComponent implements OnInit {
  // Message d'information
  message = 'Fonctionnalité d\'import temporairement désactivée';
  error: string | null = null;

  // Données de référence
  referenceData: ReferenceData | null = null;

  constructor(
    private studentService: StudentService,
    private referenceDataService: ReferenceDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadReferenceData();
  }

  private loadReferenceData(): void {
    this.referenceDataService.getAllReferenceData().subscribe({
      next: data => {
        this.referenceData = data;
      },
      error: err => {
        console.error('Erreur lors du chargement des données de référence:', err);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['dashboard', 'apprenants']);
  }
}
