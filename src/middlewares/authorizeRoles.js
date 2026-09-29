import { AuthorizationError } from '../errors/AuthorizationError.js';

export function authorizeRoles(...allowedRoles) {
  const allowedRoleSet = new Set(allowedRoles);

  return (request, response, next) => {
    void response;

    if (!request.user || !allowedRoleSet.has(request.user.role)) {
      next(new AuthorizationError());
      return;
    }

    next();
  };
}
