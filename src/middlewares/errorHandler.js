import { AppError } from '../errors/AppError.js';
import { getSafeErrorDetails, logger } from '../logger.js';
import { httpErrorsTotal } from '../metrics/registry.js';
import { normalizeRoute } from './metricsMiddleware.js';

function sendError(
  response,
  requestId,
  statusCode,
  code,
  message,
  details = []
) {
  response.status(statusCode).json({
    error: {
      code,
      message,
      details,
      requestId,
    },
  });
}

function recordError(request, code) {
  httpErrorsTotal.inc({
    route: normalizeRoute(request),
    error_code: code,
  });
}

function logServerError(error, request, code) {
  logger.error(
    {
      requestId: request.id,
      event: 'request_error',
      ...getSafeErrorDetails(error),
      errorCode: code,
    },
    'Request failed'
  );
}

export function errorHandler(error, request, response, next) {
  void next;

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    recordError(request, 'INVALID_JSON');
    sendError(
      response,
      request.id,
      400,
      'INVALID_JSON',
      'Тело запроса содержит некорректный JSON.'
    );
    return;
  }

  if (error.status === 413 || error.type === 'entity.too.large') {
    recordError(request, 'PAYLOAD_TOO_LARGE');
    sendError(
      response,
      request.id,
      413,
      'PAYLOAD_TOO_LARGE',
      'Размер тела запроса превышает допустимый лимит.'
    );
    return;
  }

  if (error instanceof AppError) {
    recordError(request, error.code);

    if ([500, 502, 504].includes(error.statusCode)) {
      logServerError(error, request, error.code);
    }

    sendError(
      response,
      request.id,
      error.statusCode,
      error.code,
      error.message,
      error.details
    );
    return;
  }

  recordError(request, 'INTERNAL_ERROR');
  logServerError(error, request, 'INTERNAL_ERROR');

  sendError(
    response,
    request.id,
    500,
    'INTERNAL_ERROR',
    'Произошла внутренняя ошибка сервера.'
  );
}
