const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';

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
