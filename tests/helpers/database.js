import { afterAll, beforeEach } from '@jest/globals';
import { sequelize } from '../../src/db/models/index.js';

function assertSafeTestDatabase() {
  const databaseName = process.env.DB_NAME;

  if (
    process.env.NODE_ENV !== 'test' ||
    !databaseName ||
    !databaseName.endsWith('_test')
  ) {
    throw new Error(
      'Destructive test cleanup is allowed only for a *_test database.'
    );
  }
}

export async function cleanupDatabase() {
  assertSafeTestDatabase();

  await sequelize.query(`
    TRUNCATE TABLE
      auth_sessions,
      users,
      request_status_history,
      request_assignees,
      maintenance_requests,
      equipment_passports,
      equipment,
      technicians,
      sites
    RESTART IDENTITY CASCADE
  `);
}

export function useTestDatabase() {
  beforeEach(cleanupDatabase);
  afterAll(async () => {
    await sequelize.close();
  });
}
