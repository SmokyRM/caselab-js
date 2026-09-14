import {
  FORECAST_API_URL,
  GEOCODING_API_URL,
  PRECIPITATION_UNIT,
  REQUEST_TIMEOUT_MS,
  TEMPERATURE_UNIT,
} from '../config.js';
import {
  WeatherApiError,
  WeatherApiTimeoutError,
} from '../errors/WeatherApiError.js';

function createApiUrl(apiUrl) {
  try {
    return new URL(apiUrl);
  } catch (error) {
    throw new WeatherApiError('Указан некорректный URL Open-Meteo.', error);
  }
}

async function requestJson(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    let response;

    try {
      response = await fetch(url, {
        signal: controller.signal,
      });
    } catch (error) {
      if (error.name === 'AbortError' || controller.signal.aborted) {
        throw new WeatherApiTimeoutError(REQUEST_TIMEOUT_MS, error);
      }

      throw new WeatherApiError(
        'Не удалось подключиться к Open-Meteo. Проверьте интернет-соединение.',
        error
      );
    }

    if (!response.ok) {
      if (response.status >= 400 && response.status <= 499) {
        throw new WeatherApiError(
          `Ошибка клиента Open-Meteo: HTTP ${response.status}.`
        );
      }

      if (response.status >= 500) {
        throw new WeatherApiError(
          `Ошибка сервера Open-Meteo: HTTP ${response.status}.`
        );
      }

      throw new WeatherApiError(`Ошибка Open-Meteo: HTTP ${response.status}.`);
    }

    try {
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError' || controller.signal.aborted) {
        throw new WeatherApiTimeoutError(REQUEST_TIMEOUT_MS, error);
      }

      throw new WeatherApiError('Open-Meteo вернул некорректный JSON.', error);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getCoordinates(city) {
  const url = createApiUrl(GEOCODING_API_URL);
  const searchParams = new URLSearchParams({
    name: city,
    count: '1',
    language: 'ru',
    format: 'json',
  });

  url.search = searchParams.toString();

  const data = await requestJson(url);

  if (!Array.isArray(data.results) || data.results.length === 0) {
    throw new Error(`Город "${city}" не найден.`);
  }

  const firstResult = data.results[0];

  return {
    name: firstResult.name,
    country: firstResult.country,
    latitude: firstResult.latitude,
    longitude: firstResult.longitude,
  };
}

export async function getForecast(latitude, longitude, days, options = {}) {
  const precipitationUnit = options.precipitationUnit ?? PRECIPITATION_UNIT;
  const url = createApiUrl(FORECAST_API_URL);
  const searchParams = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily:
      'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
    forecast_days: String(days),
    timezone: 'auto',
    temperature_unit: TEMPERATURE_UNIT,
    precipitation_unit: precipitationUnit,
    wind_speed_unit: 'kmh',
  });

  url.search = searchParams.toString();

  const data = await requestJson(url);
  const daily = data.daily;

  if (
    !daily ||
    !Array.isArray(daily.time) ||
    !Array.isArray(daily.temperature_2m_min) ||
    !Array.isArray(daily.temperature_2m_max) ||
    !Array.isArray(daily.precipitation_sum) ||
    !Array.isArray(daily.wind_speed_10m_max)
  ) {
    throw new WeatherApiError('Ответ Open-Meteo не содержит данных прогноза.');
  }

  const forecastLength = daily.time.length;

  if (
    forecastLength === 0 ||
    daily.temperature_2m_min.length !== forecastLength ||
    daily.temperature_2m_max.length !== forecastLength ||
    daily.precipitation_sum.length !== forecastLength ||
    daily.wind_speed_10m_max.length !== forecastLength
  ) {
    throw new WeatherApiError(
      'Данные прогноза Open-Meteo имеют неверный формат.'
    );
  }

  return daily.time.map((date, index) => ({
    date,
    minTemperature: daily.temperature_2m_min[index],
    maxTemperature: daily.temperature_2m_max[index],
    precipitation: daily.precipitation_sum[index],
    maxWindSpeed: daily.wind_speed_10m_max[index],
  }));
}
