import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService, CertificateData } from '@core/services';

export interface DocumentType {
  id: string;
  name: string;
  description: string;
  icon: string;
  available: boolean;
}

@Component({
  selector: 'app-document-generation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-generation-modal.component.html',
  styleUrls: ['./document-generation-modal.component.scss']
})
export class DocumentGenerationModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() student_uuid!: string;
  @Input() studentName!: string;
  @Output() closeModal = new EventEmitter<void>();

  certificateData: CertificateData | null = null;
  isLoading = false;
  error: string | null = null;

  documentTypes: DocumentType[] = [
    {
      id: 'certificate',
      name: 'Certificat de Formation',
      description: 'Certificat officiel de fin de formation',
      icon: 'fas fa-certificate',
      available: true
    },
    {
      id: 'attendance',
      name: 'Attestation de Présence',
      description: 'Attestation de présence aux cours',
      icon: 'fas fa-calendar-check',
      available: false // Pas encore implémenté
    },
    {
      id: 'level',
      name: 'Attestation de Niveau',
      description: 'Attestation du niveau de français atteint',
      icon: 'fas fa-award',
      available: false // Pas encore implémenté
    }
  ];

  constructor(private documentService: DocumentService) {}

  ngOnInit(): void {
    // Plus besoin de charger les données à l'avance
  }

  ngOnChanges(): void {
    // Plus besoin de charger les données à l'avance
  }

  /**
   * Génère un document selon le type
   */
  generateDocument(documentType: DocumentType): void {
    if (!documentType.available) {
      alert('Ce type de document n\'est pas encore disponible');
      return;
    }

    if (documentType.id === 'certificate') {
      this.downloadCertificate();
    }
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
        this.closeModal.emit();
      },
      error: (err) => {
        this.error = 'Erreur lors du téléchargement du certificat';
        this.isLoading = false;
        console.error('Erreur:', err);
      }
    });
  }



  /**
   * Ferme la modal
   */
  close(): void {
    this.closeModal.emit();
  }

  /**
   * Gestion du clic sur l'overlay
   */
  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
} 