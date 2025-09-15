import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface CertificateData {
  studentName: string;
  birthDate: string;
  nationality?: string;
  frenchLevel: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  attendanceRate: number;
  finalLevel: string;
  issueDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = `${environment.apiUrl}/documents`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Télécharge un certificat PDF
   */
  downloadCertificate(student_uuid: string): Observable<Blob> {
    const headers = this.getHeaders();
    
    return this.http.get(
      `${this.apiUrl}/certificate/${student_uuid}`,
      { 
        headers,
        responseType: 'blob' // Important pour les fichiers PDF
      }
    );
  }

  /**
   * Récupère les données du certificat sans générer le PDF
   */
  getCertificateData(student_uuid: string): Observable<CertificateData> {
    const headers = this.getHeaders();
    
    return this.http.get<CertificateData>(
      `${this.apiUrl}/certificate/${student_uuid}/data`,
      { headers }
    );
  }

  /**
   * Génère l'URL de prévisualisation avec token
   */
  getPreviewUrl(student_uuid: string): string {
    const token = this.authService.getToken();
    return `${this.apiUrl}/certificate/${student_uuid}/preview?token=${token}`;
  }

  /**
   * Headers avec authentification
   */
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Déclenche le téléchargement d'un blob PDF
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
} 