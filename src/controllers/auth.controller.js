import { AUTH_COOKIE_NAME, JWT_ACCESS_TTL_SECONDS } from '../config.js';
import { clearRefreshCookie, setRefreshCookie } from '../security/cookies.js';
import * as authService from '../services/auth.service.js';

function sendAuthenticatedUser(response, session) {
  setRefreshCookie(response, session.refreshToken);
  response.status(200).json({
    user: session.user,
    accessToken: session.accessToken,
    expiresIn: JWT_ACCESS_TTL_SECONDS,
  });
}

export async function register(request, response) {
  const user = await authService.registerUser(request.validated.body);
  response.status(201).json({ user });
}

export async function login(request, response) {
  const user = await authService.authenticateUser(request.validated.body);
  const session = await authService.createSessionForUser(user);
  sendAuthenticatedUser(response, session);
}

export async function refresh(request, response) {
  const session = await authService.refreshSession(
    request.cookies[AUTH_COOKIE_NAME]
  );
  sendAuthenticatedUser(response, session);
}

export async function logout(request, response) {
  await authService.logoutSession(request.cookies[AUTH_COOKIE_NAME]);
  clearRefreshCookie(response);
  response.status(204).send();
}

export async function getCurrentUser(request, response) {
  const user = await authService.getCurrentUser(request.user.id);
  response.status(200).json({ user });
}
