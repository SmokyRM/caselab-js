const process = globalThis.process;

try {
  process.loadEnvFile();
} catch (error) {
  if (error.code !== 'ENOENT') {
    throw error;
  }
}

function getEnvValue(name, defaultValue) {
  const value = process.env[name];

  return value && value.trim() ? value : defaultValue;
}

function getRequiredEnvValue(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function getIntegerEnvValue(name, defaultValue, isValid) {
  const value = process.env[name]?.trim();
  const number = Number(value);

  return value && Number.isInteger(number) && isValid(number)
    ? number
    : defaultValue;
}

const poolMax = getIntegerEnvValue('DB_POOL_MAX', 10, (value) => value > 0);
const poolMin = getIntegerEnvValue(
  'DB_POOL_MIN',
  0,
  (value) => value >= 0 && value <= poolMax
);

module.exports = {
  development: {
    dialect: 'postgres',
    host: getEnvValue('DB_HOST', 'localhost'),
    port: getIntegerEnvValue('DB_PORT', 5432, (value) => value > 0),
    database: getEnvValue('DB_NAME', 'caselab'),
    username: getEnvValue('DB_USER', 'caselab'),
    password: getRequiredEnvValue('DB_PASSWORD'),
    pool: {
      max: poolMax,
      min: poolMin,
      acquire: getIntegerEnvValue(
        'DB_POOL_ACQUIRE_MS',
        30000,
        (value) => value > 0
      ),
      idle: getIntegerEnvValue('DB_POOL_IDLE_MS', 10000, (value) => value > 0),
    },
    logging: false,
  },
};
