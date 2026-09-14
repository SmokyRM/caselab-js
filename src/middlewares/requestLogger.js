import { logger } from '../logger.js';

export function requestLogger(request, response, next) {
  const startedAt = process.hrtime.bigint();

  response.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const logData = {
      requestId: request.id,
      method: request.method,
      path: request.originalUrl,
      status: response.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    };

    if (response.statusCode >= 500) {
      logger.error(logData, 'HTTP request completed');
    } else if (response.statusCode >= 400) {
      logger.warn(logData, 'HTTP request completed');
    } else {
      logger.info(logData, 'HTTP request completed');
    }
  });

  next();
}
