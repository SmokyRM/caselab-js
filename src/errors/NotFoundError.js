import { AppError } from './AppError.js';

export class NotFoundError extends AppError {
  constructor(message = 'Ресурс не найден.', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}
