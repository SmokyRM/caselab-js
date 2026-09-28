import { rateLimit } from 'express-rate-limit';
import {
  AUTH_LOGIN_RATE_LIMIT_MAX,
  AUTH_LOGIN_RATE_LIMIT_WINDOW_MS,
} from '../config.js';
import { AppError } from '../errors/AppError.js';

export const authLoginRateLimiter = rateLimit({
  windowMs: AUTH_LOGIN_RATE_LIMIT_WINDOW_MS,
  limit: AUTH_LOGIN_RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler(request, response, next) {
    void request;
    void response;

    next(
      new AppError(
        'Слишком много попыток входа. Повторите позже.',
        429,
        'AUTH_RATE_LIMIT_EXCEEDED'
      )
    );
  },
});
