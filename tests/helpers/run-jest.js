import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const scope = process.argv[2];
const validScopes = new Set(['unit', 'integration', 'coverage', 'migrate']);

if (!validScopes.has(scope)) {
  throw new Error(`Unknown test scope: ${scope}`);
}

const testEnvironment = {
  ...process.env,
  NODE_ENV: 'test',
  DB_HOST: process.env.TEST_DB_HOST || '127.0.0.1',
  DB_PORT: process.env.TEST_DB_PORT || '5433',
  DB_NAME: process.env.TEST_DB_NAME || 'caselab_test',
  DB_USER: process.env.TEST_DB_USER || 'caselab_test',
  DB_PASSWORD: process.env.TEST_DB_PASSWORD || 'caselab_test_password',
  TEST_DB_HOST: process.env.TEST_DB_HOST || '127.0.0.1',
  TEST_DB_PORT: process.env.TEST_DB_PORT || '5433',
  TEST_DB_NAME: process.env.TEST_DB_NAME || 'caselab_test',
  TEST_DB_USER: process.env.TEST_DB_USER || 'caselab_test',
  TEST_DB_PASSWORD: process.env.TEST_DB_PASSWORD || 'caselab_test_password',
  JWT_ACCESS_SECRET: 'jest-only-access-secret-at-least-32-characters',
  AUTH_LOGIN_RATE_LIMIT_MAX: '1000',
  RATE_LIMIT_MAX: '10000',
  LOG_LEVEL: 'silent',
};

function runNode(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: process.cwd(),
    env: testEnvironment,
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function migrateTestDatabase() {
  runNode([
    path.resolve('node_modules/sequelize-cli/lib/sequelize'),
    'db:migrate',
    '--env',
    'test',
  ]);
}

if (scope === 'migrate') {
  migrateTestDatabase();
  process.exit(0);
}

if (scope === 'integration' || scope === 'coverage') {
  migrateTestDatabase();
}

const jestArguments = [
  '--experimental-vm-modules',
  path.resolve('node_modules/jest/bin/jest.js'),
  '--config',
  path.resolve('jest.config.js'),
];

if (scope === 'unit') {
  jestArguments.push('--testPathPatterns', 'tests/unit');
}

if (scope === 'integration') {
  jestArguments.push('--testPathPatterns', 'tests/integration', '--runInBand');
}

if (scope === 'coverage') {
  jestArguments.push('--coverage', '--runInBand');
}

runNode(jestArguments);
