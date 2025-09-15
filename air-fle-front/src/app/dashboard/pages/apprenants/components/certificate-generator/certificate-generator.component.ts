import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService, CertificateData } from '@core/services';

@Component({
  selector: 'app-certificate-generator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certificate-generator.component.html',
  styleUrls: ['./certificate-generator.component.scss']
})
export class CertificateGeneratorComponent implements OnInit {
  @Input() student_uuid!: string;
  @Input() studentName!: string;

  certificateData: CertificateData | null = null;
  isLoading = false;
  error: string | null = null;

  constructor(private documentService: DocumentService) {}

  ngOnInit(): void {
    if (this.student_uuid) {
      this.loadCertificateData();
    }
  }

  /**
   * Charge les données du certificat
   */
  loadCertificateData(): void {
    this.isLoading = true;
    this.error = null;

    this.documentService.getCertificateData(this.student_uuid).subscribe({
      next: (data) => {
        this.certificateData = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des données du certificat';
        this.isLoading = false;
        console.error('Erreur:', err);
      }
    });
  }

  /**
   * Télécharge le certificat PDF
   */
  downloadCertificate(): void {
    this.isLoading = true;
    this.error = null;

    this.documentService.downloadCertificate(this.student_uuid).subscribe({
      next: (blob) => {
        const filename = `certificat-formation-${this.student_uuid}-${new Date().toISOString().split('T')[0]}.pdf`;
        this.documentService.downloadBlob(blob, filename);
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du téléchargement du certificat';
        this.isLoading = false;
        console.error('Erreur:', err);
      }
    });
  }

  /**
   * Ouvre la prévisualisation dans un nouvel onglet
   */
  previewCertificate(): void {
    const previewUrl = this.documentService.getPreviewUrl(this.student_uuid);
    window.open(previewUrl, '_blank');
  }

  /**
   * Formate la date pour l'affichage
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }
} 