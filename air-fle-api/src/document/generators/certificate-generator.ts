import * as PDFDocument from 'pdfkit';
import { IDocumentGenerator } from '../interfaces/document-generator.interface';

export interface CertificateData {
  studentName: string;
  birthDate: string;
  nationality?: string;
  startDate: string;
  endDate: string;
  issueDate: string;
}

export class CertificateGenerator implements IDocumentGenerator {
  async generate(data: CertificateData): Promise<Buffer> {
    return this.createCertificatePDF(data);
  }

  private createCertificatePDF(data: CertificateData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 40, bottom: 40, left: 70, right: 70 },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        const pageWidth = 595; // A4 width
        const contentWidth = pageWidth - 140; // 70px margins on each side = 455px

        // En-tête du centre de formation
        doc
          .fontSize(18)
          .font('Helvetica-Bold')
          .fillColor('#2c3e50')
          .text('CENTRE DE FORMATION AIR FLE', 70, doc.y, {
            width: contentWidth,
            align: 'center',
          });

        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#7f8c8d')
          .text('Centre de Formation Professionnelle', 70, doc.y, {
            width: contentWidth,
            align: 'center',
          })
          .text('Français Langue Étrangère', 70, doc.y, {
            width: contentWidth,
            align: 'center',
          });

        // Ligne de séparation
        doc
          .moveTo(70, doc.y + 10)
          .lineTo(525, doc.y + 10)
          .strokeColor('#2c3e50')
          .lineWidth(2)
          .stroke();

        doc.moveDown(1.5);

        // Titre du certificat
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .fillColor('#2c3e50')
          .text('CERTIFICAT DE FORMATION', 70, doc.y, {
            width: contentWidth,
            align: 'center',
          });

        doc.moveDown(1.5);

        // Date et lieu
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#000')
          .text(`Fait à Marcq-en-Barœul, le ${data.issueDate}`, 70, doc.y, {
            width: contentWidth,
            align: 'right',
          });

        doc.moveDown(1.5);

        // Corps du certificat - texte simplifié
        doc
          .fontSize(13)
          .font('Helvetica')
          .text("L'établissement Air FLE,", 70, doc.y, {
            width: contentWidth,
            align: 'left',
          });

        doc.moveDown(0.8);
        doc
          .fontSize(15)
          .font('Helvetica-Bold')
          .text('CERTIFIE QUE', 70, doc.y, {
            width: contentWidth,
            align: 'center',
          });

        doc.moveDown(1.5);

        // Informations de l'étudiant dans un cadre
        const startY = doc.y;
        const boxWidth = contentWidth - 20; // 435px
        const boxHeight = 80;

        doc
          .rect(80, startY, boxWidth, boxHeight)
          .fillColor('#f8f9fa')
          .fill()
          .rect(80, startY, boxWidth, boxHeight)
          .strokeColor('#3498db')
          .lineWidth(2)
          .stroke();

        doc
          .fillColor('#000')
          .fontSize(12)
          .font('Helvetica')
          .text(`Nom et Prénom : `, 100, startY + 15)
          .font('Helvetica-Bold')
          .text(data.studentName, 220, startY + 15);

        doc
          .font('Helvetica')
          .text(`Date de naissance : `, 100, startY + 35)
          .font('Helvetica-Bold')
          .text(data.birthDate, 240, startY + 35);

        if (data.nationality) {
          doc
            .font('Helvetica')
            .text(`Nationalité : `, 100, startY + 55)
            .font('Helvetica-Bold')
            .text(data.nationality, 190, startY + 55);
        }

        doc.y = startY + boxHeight + 15;

        // Détails de la formation - taille réduite
        doc
          .fontSize(11)
          .font('Helvetica')
          .text(
            `a suivi avec succès une formation de français langue étrangère dans notre établissement.`,
            70,
            doc.y,
            {
              width: contentWidth,
              align: 'left',
            },
          );

        doc.moveDown(0.8);

        // Statistiques de formation - taille réduite
        doc
          .fontSize(10)
          .text(
            `Période de formation : du ${data.startDate} au ${data.endDate}`,
            70,
            doc.y,
            { width: contentWidth, align: 'left' },
          );

        doc.moveDown(0.8);

        doc
          .fontSize(11)
          .text(
            'Cette formation lui permet de justifier de ses compétences en français auprès des autorités compétentes.',
            70,
            doc.y,
            {
              width: contentWidth,
              align: 'left',
            },
          );

        doc.moveDown(0.5);
        doc.text(
          'En foi de quoi, nous lui délivrons le présent certificat pour servir et valoir ce que de droit.',
          70,
          doc.y,
          {
            width: contentWidth,
            align: 'left',
          },
        );

        // Signature
        doc.moveDown(1.5);
        doc
          .fontSize(10)
          .text('Le Responsable Pédagogique', 380, doc.y)
          .text('Centre Air FLE', 380, doc.y + 40);

        // Ligne de signature
        doc
          .moveTo(380, doc.y + 25)
          .lineTo(480, doc.y + 25)
          .strokeColor('#000')
          .lineWidth(1)
          .stroke();

        // Note de validité
        doc
          .fontSize(9)
          .fillColor('#7f8c8d')
          .text(
            "Ce certificat est valable 6 mois à compter de sa date d'émission.",
            70,
            750,
            {
              width: contentWidth,
              align: 'center',
            },
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
