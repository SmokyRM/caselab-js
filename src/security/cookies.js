import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_SAME_SITE,
  AUTH_COOKIE_SECURE,
  REFRESH_TOKEN_TTL_SECONDS,
} from '../config.js';

const baseRefreshCookieOptions = {
  httpOnly: true,
  secure: AUTH_COOKIE_SECURE,
  sameSite: AUTH_COOKIE_SAME_SITE,
  path: '/api/auth',
};

export function setRefreshCookie(response, refreshToken) {
  response.cookie(AUTH_COOKIE_NAME, refreshToken, {
    ...baseRefreshCookieOptions,
    maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
  });
}

export function clearRefreshCookie(response) {
  response.clearCookie(AUTH_COOKIE_NAME, baseRefreshCookieOptions);
}
