import { AppError } from './AppError.js';

export class ValidationError extends AppError {
  constructor(message = 'Переданы некорректные данные.', details = []) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}
