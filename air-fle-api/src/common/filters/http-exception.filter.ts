import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../dto/api-response.dto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Une erreur interne est survenue';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        const exceptionMessage = exceptionResponse['message'];
        message = Array.isArray(exceptionMessage)
          ? exceptionMessage.join(', ')
          : String(exceptionMessage);
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log structuré de l'exception
    try {
      this.logger.error(
        JSON.stringify({
          event: 'http_exception',
          status,
          message,
          path: request?.originalUrl,
          method: request?.method,
          exception:
            exception instanceof Error
              ? { name: exception.name, stack: exception.stack }
              : typeof exception,
        }),
      );
    } catch {
      // Silently ignore logging errors
    }

    const errorResponse = ApiResponse.error(message, status);

    response.status(status).json(errorResponse);
  }
}
