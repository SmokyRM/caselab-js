const DEFAULT_GEOCODING_API_URL =
  'https://geocoding-api.open-meteo.com/v1/search';
const DEFAULT_FORECAST_API_URL = 'https://api.open-meteo.com/v1/forecast';
const DEFAULT_REQUEST_TIMEOUT_MS = 5000;
const DEFAULT_REPORTS_DIR = 'reports';
const DEFAULT_TEMPERATURE_UNIT = 'celsius';
const DEFAULT_PRECIPITATION_UNIT = 'mm';
const DEFAULT_PORT = 3000;
const DEFAULT_NODE_ENV = 'development';
const DEFAULT_OUTDOOR_MAX_PRECIPITATION = 0;
const DEFAULT_OUTDOOR_MAX_WIND_SPEED = 36;
const DEFAULT_CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:5173'];
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60000;
const DEFAULT_RATE_LIMIT_MAX = 100;
const DEFAULT_LOG_LEVEL = 'info';
const DEFAULT_DB_HOST = 'localhost';
const DEFAULT_DB_PORT = 5432;
const DEFAULT_DB_NAME = 'caselab';
const DEFAULT_DB_USER = 'caselab';
const DEFAULT_DB_POOL_MAX = 10;
const DEFAULT_DB_POOL_MIN = 0;
const DEFAULT_DB_POOL_ACQUIRE_MS = 30000;
const DEFAULT_DB_POOL_IDLE_MS = 10000;

function getEnvValue(name, defaultValue) {
  const value = process.env[name];

  return value && value.trim() ? value : defaultValue;
}

function getAllowedEnvValue(name, allowedValues, defaultValue) {
  const value = process.env[name]?.trim();

  return allowedValues.includes(value) ? value : defaultValue;
}

function getNumberEnvValue(name, defaultValue, isValid) {
  const value = process.env[name]?.trim();
  const number = Number(value);

  return value && Number.isFinite(number) && isValid(number)
    ? number
    : defaultValue;
}

function getIntegerEnvValue(name, defaultValue, isValid) {
  return getNumberEnvValue(
    name,
    defaultValue,
    (value) => Number.isInteger(value) && isValid(value)
  );
}

function getListEnvValue(name, defaultValue) {
  const values = process.env[name]
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return values?.length ? values : defaultValue;
}

const requestTimeoutFromEnv = Number(process.env.REQUEST_TIMEOUT_MS);
const portFromEnv = Number(process.env.PORT);

export const PORT =
  Number.isInteger(portFromEnv) && portFromEnv > 0 ? portFromEnv : DEFAULT_PORT;

export const NODE_ENV = getEnvValue('NODE_ENV', DEFAULT_NODE_ENV);

export const GEOCODING_API_URL = getEnvValue(
  'GEOCODING_API_URL',
  DEFAULT_GEOCODING_API_URL
);

export const FORECAST_API_URL = getEnvValue(
  'FORECAST_API_URL',
  DEFAULT_FORECAST_API_URL
);

export const REQUEST_TIMEOUT_MS =
  Number.isFinite(requestTimeoutFromEnv) && requestTimeoutFromEnv > 0
    ? requestTimeoutFromEnv
    : DEFAULT_REQUEST_TIMEOUT_MS;

export const REPORTS_DIR = getEnvValue('REPORTS_DIR', DEFAULT_REPORTS_DIR);

export const TEMPERATURE_UNIT = getAllowedEnvValue(
  'TEMPERATURE_UNIT',
  ['celsius', 'fahrenheit'],
  DEFAULT_TEMPERATURE_UNIT
);

export const PRECIPITATION_UNIT = getAllowedEnvValue(
  'PRECIPITATION_UNIT',
  ['mm', 'inch'],
  DEFAULT_PRECIPITATION_UNIT
);

export const OUTDOOR_MAX_PRECIPITATION = getNumberEnvValue(
  'OUTDOOR_MAX_PRECIPITATION',
  DEFAULT_OUTDOOR_MAX_PRECIPITATION,
  (value) => value >= 0
);

export const OUTDOOR_MAX_WIND_SPEED = getNumberEnvValue(
  'OUTDOOR_MAX_WIND_SPEED',
  DEFAULT_OUTDOOR_MAX_WIND_SPEED,
  (value) => value > 0
);

export const CORS_ORIGINS = getListEnvValue(
  'CORS_ORIGINS',
  DEFAULT_CORS_ORIGINS
);

export const RATE_LIMIT_WINDOW_MS = getNumberEnvValue(
  'RATE_LIMIT_WINDOW_MS',
  DEFAULT_RATE_LIMIT_WINDOW_MS,
  (value) => value > 0
);

export const RATE_LIMIT_MAX = getNumberEnvValue(
  'RATE_LIMIT_MAX',
  DEFAULT_RATE_LIMIT_MAX,
  (value) => Number.isInteger(value) && value > 0
);

export const LOG_LEVEL = getAllowedEnvValue(
  'LOG_LEVEL',
  ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
  DEFAULT_LOG_LEVEL
);

export const DB_HOST = getEnvValue('DB_HOST', DEFAULT_DB_HOST);

export const DB_PORT = getIntegerEnvValue(
  'DB_PORT',
  DEFAULT_DB_PORT,
  (value) => value > 0
);

export const DB_NAME = getEnvValue('DB_NAME', DEFAULT_DB_NAME);

export const DB_USER = getEnvValue('DB_USER', DEFAULT_DB_USER);

export const DB_PASSWORD = process.env.DB_PASSWORD?.trim();

export const DB_POOL_MAX = getIntegerEnvValue(
  'DB_POOL_MAX',
  DEFAULT_DB_POOL_MAX,
  (value) => value > 0
);

export const DB_POOL_MIN = getIntegerEnvValue(
  'DB_POOL_MIN',
  DEFAULT_DB_POOL_MIN,
  (value) => value >= 0 && value <= DB_POOL_MAX
);

export const DB_POOL_ACQUIRE_MS = getIntegerEnvValue(
  'DB_POOL_ACQUIRE_MS',
  DEFAULT_DB_POOL_ACQUIRE_MS,
  (value) => value > 0
);

export const DB_POOL_IDLE_MS = getIntegerEnvValue(
  'DB_POOL_IDLE_MS',
  DEFAULT_DB_POOL_IDLE_MS,
  (value) => value > 0
);
