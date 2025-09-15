import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Logger,
} from '@nestjs/common';
import { getErrorMessage } from '../common/types/error.types';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DocumentService } from './document.service';
import { JwtService } from '@nestjs/jwt';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentController {
  private readonly logger = new Logger(DocumentController.name);
  constructor(
    private readonly documentService: DocumentService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Génère et télécharge un certificat de formation PDF
   */
  @Get('certificate/:student_uuid')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'teacher')
  @ApiOperation({
    summary: 'Générer un certificat de formation PDF',
    description:
      'Génère et retourne un certificat de formation au format PDF pour un étudiant',
  })
  @ApiParam({
    name: 'student_uuid',
    description: "UUID de l'étudiant",
    example: 'uuid-student-123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Certificat PDF généré avec succès',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Étudiant non trouvé',
  })
  async generateCertificate(
    @Param('student_uuid') student_uuid: string,
    @Res() res: Response,
  ): Promise<void> {
    // Génération du PDF
    const pdfBuffer =
      await this.documentService.generateCertificate(student_uuid);

    // Configuration des headers pour téléchargement PDF
    const filename = `certificat-formation-${student_uuid}-${new Date().toISOString().split('T')[0]}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length.toString(),
    });

    // Envoi du PDF
    res.send(pdfBuffer);

    this.logger.log(
      JSON.stringify({
        event: 'document_downloaded',
        type: 'certificate',
        student_uuid,
        mode: 'attachment',
      }),
    );
  }

  /**
   * Prévisualise un certificat dans le navigateur (sans téléchargement)
   */
  @Get('certificate/:student_uuid/preview')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'teacher')
  @ApiOperation({
    summary: 'Prévisualiser un certificat de formation PDF',
    description:
      'Affiche le certificat dans le navigateur sans forcer le téléchargement',
  })
  @ApiParam({
    name: 'student_uuid',
    description: "UUID de l'étudiant",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Certificat PDF affiché avec succès',
  })
  async previewCertificate(
    @Param('student_uuid') student_uuid: string,
    @Res() res: Response,
  ): Promise<void> {
    // Génération du PDF
    const pdfBuffer =
      await this.documentService.generateCertificate(student_uuid);

    // Configuration des headers pour affichage dans le navigateur
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline', // Affichage dans le navigateur
      'Content-Length': pdfBuffer.length.toString(),
    });

    // Envoi du PDF
    res.send(pdfBuffer);

    this.logger.log(
      JSON.stringify({
        event: 'document_preview',
        type: 'certificate',
        student_uuid,
        mode: 'inline',
      }),
    );
  }

  /**
   * Prévisualise un certificat avec authentification par token URL (pour window.open)
   */
  @Get('certificate/:student_uuid/preview-token')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'Prévisualiser un certificat avec token dans URL',
    description:
      'Permet la prévisualisation via window.open avec token en query param',
  })
  @ApiParam({
    name: 'student_uuid',
    description: "UUID de l'étudiant",
  })
  async previewCertificateWithToken(
    @Param('student_uuid') student_uuid: string,
    @Query('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Vérification manuelle du token JWT
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = this.jwtService.verify(token);
      const decoded = payload as {
        sub: string;
        email: string;
        role: string;
        permissions: string[];
        roles?: string[];
      };

      // Vérification des rôles (remplace les guards)
      if (
        !decoded.roles?.some((role: string) =>
          ['admin', 'teacher'].includes(role),
        )
      ) {
        res.status(HttpStatus.FORBIDDEN).json({
          statusCode: 403,
          message: 'Accès interdit - rôle insuffisant',
        });
        return;
      }

      // Génération du PDF
      const pdfBuffer =
        await this.documentService.generateCertificate(student_uuid);

      // Configuration des headers pour affichage dans le navigateur
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Content-Length': pdfBuffer.length.toString(),
      });

      // Envoi du PDF
      res.send(pdfBuffer);
    } catch (error) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: 401,
        message: 'Token invalide ou expiré',
      });
      this.logger.warn(
        JSON.stringify({
          event: 'document_preview_token_denied',
          type: 'certificate',
          student_uuid,
          reason: getErrorMessage(error),
        }),
      );
    }
  }

  /**
   * Récupère les données d'un certificat (sans générer le PDF)
   */
  @Get('certificate/:student_uuid/data')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'teacher')
  @ApiOperation({
    summary: 'Récupérer les données du certificat',
    description:
      'Récupère les données qui seront dans le certificat sans générer le PDF',
  })
  @ApiParam({
    name: 'student_uuid',
    description: "UUID de l'étudiant",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Données du certificat récupérées',
  })
  async getCertificateData(@Param('student_uuid') student_uuid: string) {
    const data = await this.documentService.getCertificateData(student_uuid);
    this.logger.log(
      JSON.stringify({
        event: 'document_data_retrieved',
        type: 'certificate',
        student_uuid,
      }),
    );
    return data;
  }
}
