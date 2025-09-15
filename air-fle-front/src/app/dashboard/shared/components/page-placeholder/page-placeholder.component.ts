import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-page-placeholder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="placeholder-container">
      <div class="placeholder-icon">🚧</div>
      <h2>{{ title }} - Page en construction</h2>
      <p>Cette page est en cours de développement et sera disponible prochainement.</p>
      <div class="placeholder-features" *ngIf="features && features.length > 0">
        <h3>Fonctionnalités prévues :</h3>
        <ul>
          <li *ngFor="let feature of features">{{ feature }}</li>
        </ul>
      </div>
    </div>
  `,
  styles: [
    `
      .placeholder-container {
        text-align: center;
        padding: 40px 20px;
        background-color: #fff;
        border-radius: 12px;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
      }

      .placeholder-icon {
        font-size: 4rem;
        margin-bottom: 20px;
      }

      h2 {
        color: #2d3748;
        margin-top: 0;
        margin-bottom: 10px;
      }

      p {
        color: #718096;
        margin-bottom: 30px;
        font-size: 1.1rem;
      }

      .placeholder-features {
        max-width: 500px;
        margin: 0 auto;
        text-align: left;
      }

      h3 {
        color: #2d3748;
        margin-bottom: 10px;
      }

      ul {
        color: #718096;
        padding-left: 20px;
      }

      li {
        margin-bottom: 5px;
      }
    `,
  ],
})
export class PagePlaceholderComponent implements OnInit {
  @Input() title: string = 'Page';
  @Input() features: string[] = [];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Récupérer les données de route pour personnaliser le placeholder
    this.route.data.subscribe(data => {
      if (data['title']) {
        this.title = data['title'];
      }

      if (data['features']) {
        this.features = data['features'];
      }
    });
  }
}
