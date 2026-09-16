import { AppError } from './AppError.js';

export class ConflictError extends AppError {
  constructor(message = 'Ресурс уже существует.', code = 'CONFLICT') {
    super(message, 409, code);
  }
}
