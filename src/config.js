const DEFAULT_GEOCODING_API_URL =
  'https://geocoding-api.open-meteo.com/v1/search';
const DEFAULT_FORECAST_API_URL = 'https://api.open-meteo.com/v1/forecast';
const DEFAULT_REQUEST_TIMEOUT_MS = 5000;
const DEFAULT_REPORTS_DIR = 'reports';
const DEFAULT_TEMPERATURE_UNIT = 'celsius';
const DEFAULT_PRECIPITATION_UNIT = 'mm';

function getEnvValue(name, defaultValue) {
  const value = process.env[name];

  return value && value.trim() ? value : defaultValue;
}

function getAllowedEnvValue(name, allowedValues, defaultValue) {
  const value = process.env[name]?.trim();

  return allowedValues.includes(value) ? value : defaultValue;
}

const requestTimeoutFromEnv = Number(process.env.REQUEST_TIMEOUT_MS);

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
