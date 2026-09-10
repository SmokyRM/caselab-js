const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_API_URL = 'https://api.open-meteo.com/v1/forecast';

export async function getCoordinates(city) {
  const url = new URL(GEOCODING_API_URL);
  const searchParams = new URLSearchParams({
    name: city,
    count: '1',
    language: 'ru',
    format: 'json',
  });

  url.search = searchParams.toString();

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Ошибка запроса к Open-Meteo: статус ${response.status}.`);
  }

  const data = await response.json();

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

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Ошибка запроса прогноза Open-Meteo: статус ${response.status}.`,
    );
  }

  const data = await response.json();
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
