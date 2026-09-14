import { AppError } from './AppError.js';

export class WeatherApiError extends AppError {
  constructor(message, cause) {
    super(message, 502, 'WEATHER_API_ERROR');
    this.cause = cause;
  }
}

export class WeatherApiTimeoutError extends AppError {
  constructor(timeoutMs, cause) {
    super(
      `Превышено время ожидания ответа Open-Meteo (${timeoutMs} мс).`,
      504,
      'WEATHER_API_TIMEOUT'
    );
    this.cause = cause;
  }
}
