import { UniqueConstraintError } from 'sequelize';
import { REFRESH_TOKEN_TTL_SECONDS } from '../config.js';
import { sequelize } from '../db/models/index.js';
import { AuthenticationError } from '../errors/AuthenticationError.js';
import { ConflictError } from '../errors/ConflictError.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import * as authRepository from '../repositories/auth.repository.js';
import { hashPassword, verifyPassword } from '../security/password.js';
import {
  createAccessToken,
  createRefreshToken,
  hashRefreshToken,
} from '../security/tokens.js';

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    technicianId: user.technicianId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function createInvalidCredentialsError() {
  return new AuthenticationError(
    'Неверный email или пароль.',
    'INVALID_CREDENTIALS'
  );
}

function createInvalidRefreshTokenError() {
  return new AuthenticationError(
    'Недействительный refresh token.',
    'INVALID_REFRESH_TOKEN'
  );
}

export async function registerUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const passwordHash = await hashPassword(password);

  try {
    const user = await authRepository.createUser({
      email: normalizedEmail,
      passwordHash,
      role: 'viewer',
    });

    return toPublicUser(user);
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new ConflictError(
        'Пользователь с таким email уже существует.',
        'EMAIL_ALREADY_EXISTS'
      );
    }

    throw error;
  }
}

export async function authenticateUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await authRepository.findUserByEmail(normalizedEmail);

  if (!user) throw createInvalidCredentialsError();

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) throw createInvalidCredentialsError();

  return toPublicUser(user);
}

export async function createSessionForUser(user) {
  const refreshToken = createRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const refreshExpiresAt = new Date(
    Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000
  );
  const accessToken = await createAccessToken(user);

  await authRepository.createSession({
    userId: user.id,
    refreshTokenHash,
    expiresAt: refreshExpiresAt,
  });

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken,
    refreshExpiresAt: refreshExpiresAt.toISOString(),
  };
}

export async function refreshSession(refreshToken) {
  if (typeof refreshToken !== 'string' || !refreshToken) {
    throw createInvalidRefreshTokenError();
  }

  const currentTokenHash = hashRefreshToken(refreshToken);

  return sequelize.transaction(async (transaction) => {
    const session = await authRepository.findSessionByTokenHash(
      currentTokenHash,
      { transaction, lock: true }
    );

    if (
      !session ||
      session.revokedAt ||
      new Date(session.expiresAt) <= new Date()
    ) {
      throw createInvalidRefreshTokenError();
    }

    const user = await authRepository.findUserById(session.userId, {
      transaction,
    });

    if (!user) throw createInvalidRefreshTokenError();

    const newRefreshToken = createRefreshToken();
    const newRefreshTokenHash = hashRefreshToken(newRefreshToken);
    const lastUsedAt = new Date();

    await authRepository.updateSession(
      session.id,
      {
        refreshTokenHash: newRefreshTokenHash,
        lastUsedAt,
      },
      { transaction }
    );

    return {
      user: toPublicUser(user),
      accessToken: await createAccessToken(user),
      refreshToken: newRefreshToken,
      refreshExpiresAt: session.expiresAt,
    };
  });
}

export async function logoutSession(refreshToken) {
  if (typeof refreshToken !== 'string' || !refreshToken) return;

  const tokenHash = hashRefreshToken(refreshToken);

  await sequelize.transaction(async (transaction) => {
    const session = await authRepository.findSessionByTokenHash(tokenHash, {
      transaction,
      lock: true,
    });

    if (!session || session.revokedAt) return;

    await authRepository.revokeSession(session.id, new Date(), {
      transaction,
    });
  });
}

export async function getCurrentUser(userId) {
  const user = await authRepository.findUserById(userId);

  if (!user) {
    throw new NotFoundError('Пользователь не найден.', 'USER_NOT_FOUND');
  }

  return toPublicUser(user);
}
