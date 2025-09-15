import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-apprenants',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="apprenants-container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [
    `
      .apprenants-container {
        padding: 1rem;
      }
    `,
  ],
})
export class ApprenantsComponent {}
