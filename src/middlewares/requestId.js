import { randomUUID } from 'node:crypto';

export function requestId(request, response, next) {
  request.id = request.get('x-request-id')?.trim() || randomUUID();
  response.set('X-Request-Id', request.id);
  next();
}
