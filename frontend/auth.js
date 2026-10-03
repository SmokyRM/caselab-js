import {
  loginRequest,
  logoutRequest,
  restoreAccess,
  setAccessToken,
  setSessionLostHandler,
} from './api.js';

let currentUser = null;
let onSessionLost = () => {};

setSessionLostHandler(() => {
  currentUser = null;
  onSessionLost();
});

export function getCurrentUser() {
  return currentUser;
}

export function handleSessionLost(handler) {
  onSessionLost = typeof handler === 'function' ? handler : () => {};
}

export async function restoreSession() {
  try {
    const session = await restoreAccess();
    currentUser = session.user;
    return currentUser;
  } catch {
    setAccessToken(null);
    currentUser = null;
    return null;
  }
}

export async function signIn(email, password) {
  const session = await loginRequest(email, password);
  currentUser = session.user;
  return currentUser;
}

export async function signOut() {
  try {
    await logoutRequest();
  } finally {
    currentUser = null;
  }
}
