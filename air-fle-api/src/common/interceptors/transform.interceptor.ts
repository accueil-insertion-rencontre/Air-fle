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
    const response = context
      .switchToHttp()
      .getResponse<{ statusCode: number; status: (code: number) => void }>();
    const request = context.switchToHttp().getRequest<{
      method?: string;
      originalUrl?: string;
      logger?: { info?: (msg: string) => void };
    }>();

    return next.handle().pipe(
      map((data: T) => {
        const statusCode = response.statusCode;

        // Vérifier si la réponse contient un champ success à false
        // indiquant une erreur métier
        if (
          data &&
          typeof data === 'object' &&
          data !== null &&
          'success' in data &&
          (data as { success: boolean }).success === false
        ) {
          // Changer le code de statut en 400 (Bad Request) pour les erreurs métier
          response.status(HttpStatus.BAD_REQUEST);

          // Extraire seulement les données pertinentes sans dupliquer success/message
          const typedData = data as {
            success: boolean;
            message?: string;
            [key: string]: unknown;
          };
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { success, message, ...restData } = typedData;
          const additionalData =
            Object.keys(restData).length > 0 ? restData : null;

          return ApiResponse.error(
            (message as string) || 'Une erreur est survenue',
            HttpStatus.BAD_REQUEST,
            additionalData,
          ) as ApiResponse<T>;
        }

        // Si c'est un succès
        const message = this.getDefaultMessageForStatusCode(statusCode);
        const payload = ApiResponse.success(data as T, message, statusCode);
        return payload;
      }),
      tap(() => {
        // Log minimal des réponses 2xx
        try {
          // On n’inclut pas le body pour éviter le bruit (et les données sensibles)
          // Le logger HTTP de Pino trace déjà req/res de manière détaillée
          // Ici, on ajoute juste un événement lisible applicatif

          request.logger?.info?.(
            JSON.stringify({
              event: 'http_response',
              method: request.method ?? 'unknown',
              path: request.originalUrl ?? 'unknown',
              statusCode: response.statusCode,
            }),
          );
        } catch {
          // Silently ignore logging errors
        }
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
