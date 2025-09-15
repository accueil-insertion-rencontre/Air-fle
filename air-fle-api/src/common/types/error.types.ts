// Types pour la gestion d'erreurs standardisée

export interface PrismaError extends Error {
  code?: string;
  meta?: Record<string, unknown>;
}

export interface CustomError extends Error {
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

export function isPrismaError(error: unknown): error is PrismaError {
  return (
    error instanceof Error &&
    typeof (error as PrismaError).code === 'string' &&
    ((error as PrismaError).code?.startsWith('P') ?? false)
  );
}

export function isCustomError(error: unknown): error is CustomError {
  return error instanceof Error && 'statusCode' in error;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
}
