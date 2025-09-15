import { Injectable, Inject, Logger } from '@nestjs/common';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  IStudentDataProvider,
  STUDENT_DATA_PROVIDER,
} from './interfaces/document-generator.interface';
import {
  CertificateGenerator,
  CertificateData,
} from './generators/certificate-generator';

@Injectable()
export class DocumentService {
  private readonly certificateGenerator: CertificateGenerator;
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    @Inject(STUDENT_DATA_PROVIDER)
    private readonly studentDataProvider: IStudentDataProvider,
    // learner history removed
  ) {
    this.certificateGenerator = new CertificateGenerator();
  }

  /**
   * Génère un certificat de formation au format PDF
   */
  async generateCertificate(student_uuid: string): Promise<Buffer> {
    const certificateData = await this.getCertificateData(student_uuid);
    const pdf = await this.certificateGenerator.generate(certificateData);
    this.logger.log(
      JSON.stringify({
        event: 'document_generated',
        type: 'certificate',
        student_uuid,
      }),
    );
    return pdf;
  }

  /**
   * Récupère et agrège les données nécessaires pour le certificat
   */
  async getCertificateData(student_uuid: string): Promise<CertificateData> {
    const studentInfo =
      await this.studentDataProvider.getBasicInfo(student_uuid);
    const attendanceHistory = [] as any[]; // Historique désactivé

    const { startDate, endDate } =
      this.calculateFormationPeriod(attendanceHistory);

    return {
      studentName: `${studentInfo.student_firstname} ${studentInfo.student_lastname}`,
      birthDate: format(studentInfo.student_birthdate, 'dd/MM/yyyy'),
      nationality: studentInfo.nationality?.nationality_name,
      startDate: format(startDate, 'dd/MM/yyyy'),
      endDate: format(endDate, 'dd/MM/yyyy'),
      issueDate: format(new Date(), 'd MMMM yyyy', { locale: fr }),
    };
  }

  /**
   * Calcule la période de formation basée sur l'historique
   */
  private calculateFormationPeriod(attendanceHistory: any[]): {
    startDate: Date;
    endDate: Date;
  } {
    if (attendanceHistory.length === 0) {
      const today = new Date();
      return {
        startDate: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        endDate: today,
      };
    }

    const dates = attendanceHistory
      .map((h) => new Date(h.learner_history_date))
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      startDate: dates[0],
      endDate: dates[dates.length - 1],
    };
  }
}
