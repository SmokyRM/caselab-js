import { AppError } from './AppError.js';

export class AuthenticationError extends AppError {
  constructor(message, code) {
    super(message, 401, code);
  }
}
