import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const SCRYPT_VERSION = 'v1';
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SCRYPT_KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function validatePassword(password) {
  if (typeof password !== 'string') {
    throw new TypeError('Password must be a string.');
  }

  if (!password) {
    throw new Error('Password must not be empty.');
  }
}

function deriveKey(password, salt, keyLength) {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      keyLength,
      {
        cost: SCRYPT_COST,
        blockSize: SCRYPT_BLOCK_SIZE,
        parallelization: SCRYPT_PARALLELIZATION,
        maxmem: 64 * 1024 * 1024,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      }
    );
  });
}

function parseStoredHash(storedHash) {
  if (typeof storedHash !== 'string') return null;

  const [algorithm, version, parameters, saltValue, keyValue] =
    storedHash.split('$');

  if (
    algorithm !== 'scrypt' ||
    version !== SCRYPT_VERSION ||
    parameters !==
      `N=${SCRYPT_COST},r=${SCRYPT_BLOCK_SIZE},p=${SCRYPT_PARALLELIZATION}` ||
    !saltValue ||
    !keyValue
  ) {
    return null;
  }

  try {
    const salt = Buffer.from(saltValue, 'base64url');
    const derivedKey = Buffer.from(keyValue, 'base64url');

    if (
      salt.length !== SALT_LENGTH ||
      derivedKey.length !== SCRYPT_KEY_LENGTH
    ) {
      return null;
    }

    return { salt, derivedKey };
  } catch {
    return null;
  }
}

export async function hashPassword(password) {
  validatePassword(password);

  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = await deriveKey(password, salt, SCRYPT_KEY_LENGTH);

  return [
    'scrypt',
    SCRYPT_VERSION,
    `N=${SCRYPT_COST},r=${SCRYPT_BLOCK_SIZE},p=${SCRYPT_PARALLELIZATION}`,
    salt.toString('base64url'),
    derivedKey.toString('base64url'),
  ].join('$');
}

export async function verifyPassword(password, storedHash) {
  validatePassword(password);

  const parsedHash = parseStoredHash(storedHash);
  if (!parsedHash) return false;

  const derivedKey = await deriveKey(
    password,
    parsedHash.salt,
    parsedHash.derivedKey.length
  );

  return timingSafeEqual(derivedKey, parsedHash.derivedKey);
}
