import { createHash, randomBytes } from 'node:crypto';
import { jwtVerify, SignJWT } from 'jose';
import { JWT_ACCESS_SECRET, JWT_ACCESS_TTL_SECONDS } from '../config.js';

const JWT_ALGORITHM = 'HS256';
const REFRESH_TOKEN_BYTES = 32;
const jwtSecret = new TextEncoder().encode(JWT_ACCESS_SECRET);

function validateToken(token) {
  if (typeof token !== 'string' || !token) {
    throw new TypeError('Token must be a non-empty string.');
  }
}

export async function createAccessToken(user) {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${JWT_ACCESS_TTL_SECONDS}s`)
    .sign(jwtSecret);
}

export async function verifyAccessToken(token) {
  validateToken(token);

  const { payload } = await jwtVerify(token, jwtSecret, {
    algorithms: [JWT_ALGORITHM],
  });

  return payload;
}

export function createRefreshToken() {
  return randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
}

export function hashRefreshToken(token) {
  validateToken(token);
  return createHash('sha256').update(token).digest('hex');
}
