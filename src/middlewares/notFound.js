import { NotFoundError } from '../errors/NotFoundError.js';

export function notFound(request, response, next) {
  next(new NotFoundError('Маршрут не найден.', 'ROUTE_NOT_FOUND'));
}
