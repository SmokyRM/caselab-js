import cors from 'cors';
import { CORS_ORIGINS } from '../config.js';
import { AppError } from '../errors/AppError.js';

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin || CORS_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(
      new AppError(
        'Источник запроса не разрешён политикой CORS.',
        403,
        'CORS_ORIGIN_DENIED'
      )
    );
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Request-Id'],
});
