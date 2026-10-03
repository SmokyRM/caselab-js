import { AuthSession, User } from '../db/models/index.js';

const userAttributes = [
  'id',
  'email',
  'role',
  'technician_id',
  'created_at',
  'updated_at',
];

function toIsoString(value) {
  return value ? new Date(value).toISOString() : null;
}

function mapUser(user, includePasswordHash = false) {
  if (!user) return null;

  const plainUser = user.get({ plain: true });
  const mappedUser = {
    id: plainUser.id,
    email: plainUser.email,
    role: plainUser.role,
    technicianId: plainUser.technician_id,
    createdAt: toIsoString(plainUser.created_at),
    updatedAt: toIsoString(plainUser.updated_at),
  };

  if (includePasswordHash) {
    mappedUser.passwordHash = plainUser.password_hash;
  }

  return mappedUser;
}

function mapSession(session) {
  if (!session) return null;

  const plainSession = session.get({ plain: true });

  return {
    id: plainSession.id,
    userId: plainSession.user_id,
    refreshTokenHash: plainSession.refresh_token_hash,
    expiresAt: toIsoString(plainSession.expires_at),
    createdAt: toIsoString(plainSession.created_at),
    lastUsedAt: toIsoString(plainSession.last_used_at),
    revokedAt: toIsoString(plainSession.revoked_at),
  };
}

export async function findUserByEmail(email, options = {}) {
  const user = await User.findOne({
    attributes: [...userAttributes, 'password_hash'],
    where: { email },
    transaction: options.transaction,
  });

  return mapUser(user, true);
}

export async function findUserById(id, options = {}) {
  const user = await User.findByPk(id, {
    attributes: userAttributes,
    transaction: options.transaction,
  });

  return mapUser(user);
}

export async function createUser(data, options = {}) {
  const user = await User.create(
    {
      email: data.email,
      password_hash: data.passwordHash,
      role: data.role,
    },
    { transaction: options.transaction }
  );

  return mapUser(user);
}

export async function createSession(data, options = {}) {
  const session = await AuthSession.create(
    {
      user_id: data.userId,
      refresh_token_hash: data.refreshTokenHash,
      expires_at: data.expiresAt,
    },
    { transaction: options.transaction }
  );

  return mapSession(session);
}

export async function findSessionByTokenHash(tokenHash, options = {}) {
  const session = await AuthSession.findOne({
    where: { refresh_token_hash: tokenHash },
    transaction: options.transaction,
    lock: options.lock ? options.transaction?.LOCK.UPDATE : undefined,
  });

  return mapSession(session);
}

export async function updateSession(id, changes, options = {}) {
  const mappedChanges = {};

  if (Object.hasOwn(changes, 'refreshTokenHash')) {
    mappedChanges.refresh_token_hash = changes.refreshTokenHash;
  }
  if (Object.hasOwn(changes, 'lastUsedAt')) {
    mappedChanges.last_used_at = changes.lastUsedAt;
  }
  if (Object.hasOwn(changes, 'revokedAt')) {
    mappedChanges.revoked_at = changes.revokedAt;
  }

  await AuthSession.update(mappedChanges, {
    where: { id },
    transaction: options.transaction,
  });
}

export async function revokeSession(id, revokedAt, options = {}) {
  await updateSession(id, { revokedAt }, options);
}
