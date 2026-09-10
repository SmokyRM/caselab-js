import { REQUEST_TIMEOUT_MS } from '../config.js';

const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_API_URL = 'https://api.open-meteo.com/v1/forecast';

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
        throw new Error(
          `Превышено время ожидания ответа Open-Meteo (${REQUEST_TIMEOUT_MS} мс).`,
          { cause: error },
        );
      }

      throw new Error(
        'Не удалось подключиться к Open-Meteo. Проверьте интернет-соединение.',
        { cause: error },
      );
    }

    if (!response.ok) {
      if (response.status >= 400 && response.status <= 499) {
        throw new Error(
          `Ошибка клиента Open-Meteo: HTTP ${response.status}.`,
        );
      }

      if (response.status >= 500) {
        throw new Error(
          `Ошибка сервера Open-Meteo: HTTP ${response.status}.`,
        );
      }

      throw new Error(`Ошибка Open-Meteo: HTTP ${response.status}.`);
    }

    try {
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError' || controller.signal.aborted) {
        throw new Error(
          `Превышено время ожидания ответа Open-Meteo (${REQUEST_TIMEOUT_MS} мс).`,
          { cause: error },
        );
      }

      throw new Error('Open-Meteo вернул некорректный JSON.', {
        cause: error,
      });
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getCoordinates(city) {
  const url = new URL(GEOCODING_API_URL);
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

export async function getForecast(latitude, longitude, days) {
  const url = new URL(FORECAST_API_URL);
  const searchParams = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
    forecast_days: String(days),
    timezone: 'auto',
  });

  url.search = searchParams.toString();

  const data = await requestJson(url);
  const daily = data.daily;

  if (
    !daily ||
    !Array.isArray(daily.time) ||
    !Array.isArray(daily.temperature_2m_min) ||
    !Array.isArray(daily.temperature_2m_max) ||
    !Array.isArray(daily.precipitation_sum)
  ) {
    throw new Error('Ответ Open-Meteo не содержит данных прогноза.');
  }

  const forecastLength = daily.time.length;

  if (
    forecastLength === 0 ||
    daily.temperature_2m_min.length !== forecastLength ||
    daily.temperature_2m_max.length !== forecastLength ||
    daily.precipitation_sum.length !== forecastLength
  ) {
    throw new Error('Данные прогноза Open-Meteo имеют неверный формат.');
  }

  return daily.time.map((date, index) => ({
    date,
    minTemperature: daily.temperature_2m_min[index],
    maxTemperature: daily.temperature_2m_max[index],
    precipitation: daily.precipitation_sum[index],
  }));
}
