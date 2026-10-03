let accessToken = null;
let sessionLostHandler = () => {};
let refreshPromise = null;

export class ApiError extends Error {
  constructor({ status, code, message, requestId, details }) {
    super(message || 'The request could not be completed.');
    this.name = 'ApiError';
    this.status = status;
    this.code = code || 'HTTP_ERROR';
    this.requestId = requestId || null;
    this.details = details;
  }
}

export function setAccessToken(token) {
  accessToken = token || null;
}

export function setSessionLostHandler(handler) {
  sessionLostHandler = typeof handler === 'function' ? handler : () => {};
}

async function readResponse(response) {
  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();

  const text = await response.text();
  return text ? { message: text } : null;
}

function createApiError(response, body) {
  const error = body?.error;

  return new ApiError({
    status: response.status,
    code: error?.code,
    message: error?.message || body?.message || response.statusText,
    requestId: error?.requestId,
    details: error?.details,
  });
}

async function send(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',
  });
  const body = await readResponse(response);

  if (!response.ok) throw createApiError(response, body);
  return body;
}

export async function restoreAccess() {
  if (!refreshPromise) {
    refreshPromise = send('/api/auth/refresh', { method: 'POST' })
      .then((session) => {
        setAccessToken(session.accessToken);
        return session;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiRequest(path, options = {}, retry = true) {
  try {
    return await send(path, options);
  } catch (error) {
    const canRefresh =
      error instanceof ApiError &&
      error.status === 401 &&
      retry &&
      !path.startsWith('/api/auth/');

    if (!canRefresh) throw error;

    try {
      await restoreAccess();
      return await apiRequest(path, options, false);
    } catch (refreshError) {
      setAccessToken(null);
      sessionLostHandler();
      throw refreshError;
    }
  }
}

export async function loginRequest(email, password) {
  const session = await send('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(session.accessToken);
  return session;
}

export async function logoutRequest() {
  try {
    await send('/api/auth/logout', { method: 'POST' });
  } finally {
    setAccessToken(null);
  }
}
