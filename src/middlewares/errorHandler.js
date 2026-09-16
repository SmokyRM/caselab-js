import { AppError } from '../errors/AppError.js';

function sendError(response, statusCode, code, message, details = []) {
  response.status(statusCode).json({
    error: {
      code,
      message,
      details,
    },
  });
}

export function errorHandler(error, request, response, next) {
  void next;

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    sendError(
      response,
      400,
      'INVALID_JSON',
      'Тело запроса содержит некорректный JSON.'
    );
    return;
  }

  if (error instanceof AppError) {
    sendError(
      response,
      error.statusCode,
      error.code,
      error.message,
      error.details
    );
    return;
  }

  sendError(
    response,
    500,
    'INTERNAL_ERROR',
    'Произошла внутренняя ошибка сервера.'
  );
}
