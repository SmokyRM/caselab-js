import { AuthenticationError } from '../errors/AuthenticationError.js';
import { verifyAccessToken } from '../security/tokens.js';

const userRoles = new Set(['viewer', 'technician', 'admin']);

function createAuthenticationRequiredError() {
  return new AuthenticationError(
    'Требуется аутентификация.',
    'AUTHENTICATION_REQUIRED'
  );
}

function createInvalidAccessTokenError() {
  return new AuthenticationError(
    'Недействительный access token.',
    'INVALID_ACCESS_TOKEN'
  );
}

export async function authenticate(request, response, next) {
  void response;

  const authorization = request.get('authorization');
  if (!authorization) {
    next(createAuthenticationRequiredError());
    return;
  }

  const match = authorization.match(/^Bearer\s+(\S+)$/i);
  if (!match) {
    next(createInvalidAccessTokenError());
    return;
  }

  try {
    const payload = await verifyAccessToken(match[1]);

    if (
      typeof payload.sub !== 'string' ||
      typeof payload.role !== 'string' ||
      !userRoles.has(payload.role)
    ) {
      throw createInvalidAccessTokenError();
    }

    request.user = {
      id: payload.sub,
      role: payload.role,
    };
    next();
  } catch {
    next(createInvalidAccessTokenError());
  }
}
