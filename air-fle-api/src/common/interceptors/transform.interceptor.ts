import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiResponse } from '../dto/api-response.dto';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode;

        // Vérifier si la réponse contient un champ success à false
        // indiquant une erreur métier
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          data.success === false
        ) {
          // Changer le code de statut en 400 (Bad Request) pour les erreurs métier
          response.status(HttpStatus.BAD_REQUEST);

          // Extraire seulement les données pertinentes sans dupliquer success/message
          const { success, message, ...restData } = data;
          const additionalData =
            Object.keys(restData).length > 0 ? restData : null;

          return ApiResponse.error(
            message || 'Une erreur est survenue',
            HttpStatus.BAD_REQUEST,
            additionalData,
          );
        }

        // Si c'est un succès
        const message = this.getDefaultMessageForStatusCode(statusCode);
        const payload = ApiResponse.success(data, message, statusCode);
        return payload;
      }),
      tap((payload) => {
        // Log minimal des réponses 2xx
        try {
          // On n’inclut pas le body pour éviter le bruit (et les données sensibles)
          // Le logger HTTP de Pino trace déjà req/res de manière détaillée
          // Ici, on ajoute juste un événement lisible applicatif

          request?.logger?.info?.(
            JSON.stringify({
              event: 'http_response',
              method: request?.method,
              path: request?.originalUrl,
              statusCode: response?.statusCode,
            }),
          );
        } catch {}
      }),
    );
  }

  private getDefaultMessageForStatusCode(statusCode: number): string {
    switch (statusCode) {
      case 200:
        return 'Opération réussie';
      case 201:
        return 'Ressource créée avec succès';
      case 204:
        return 'Opération réussie sans contenu';
      default:
        return 'Opération réussie';
    }
  }
}
