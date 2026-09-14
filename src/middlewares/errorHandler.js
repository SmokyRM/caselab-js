import { AppError } from '../errors/AppError.js';
import { logger } from '../logger.js';

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

export function errorHandler(error, request, response, next) {
  void next;

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
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

  logger.error(
    { err: error, requestId: request.id },
    'Unexpected request error'
  );

  sendError(
    response,
    request.id,
    500,
    'INTERNAL_ERROR',
    'Произошла внутренняя ошибка сервера.'
  );
}
