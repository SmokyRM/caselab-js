import { AppError } from './AppError.js';

export class ServiceNotReadyError extends AppError {
  constructor(cause) {
    super('Сервис временно не готов.', 503, 'SERVICE_NOT_READY');
    this.cause = cause;
  }
}
