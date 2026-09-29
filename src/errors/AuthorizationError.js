import { AppError } from './AppError.js';

export class AuthorizationError extends AppError {
  constructor() {
    super('Недостаточно прав для выполнения операции.', 403, 'FORBIDDEN');
  }
}
