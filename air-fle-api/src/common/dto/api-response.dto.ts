export class ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  statusCode: number;
  timestamp: string;

  constructor(
    success: boolean,
    data: T | null,
    message: string,
    statusCode: number,
  ) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(
    data: T,
    message = 'Opération réussie',
    statusCode = 200,
  ): ApiResponse<T> {
    return new ApiResponse<T>(true, data, message, statusCode);
  }

  static error<T>(
    message = 'Une erreur est survenue',
    statusCode = 400,
    data: T | null = null,
  ): ApiResponse<T> {
    return new ApiResponse<T>(false, data, message, statusCode);
  }
}
