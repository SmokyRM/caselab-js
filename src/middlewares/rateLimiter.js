import { rateLimit } from 'express-rate-limit';
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from '../config.js';
import { AppError } from '../errors/AppError.js';

export const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler(request, response, next) {
    next(
      new AppError(
        'Слишком много запросов. Повторите позже.',
        429,
        'RATE_LIMIT_EXCEEDED'
      )
    );
  },
});
