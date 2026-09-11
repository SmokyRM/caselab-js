import { getCoordinates, getForecast } from '../api/openMeteo.js';
import { loadReport } from '../storage/reportStorage.js';

export async function getWeatherForCity(city, days, noCache) {
  if (!noCache) {
    const cachedWeather = await loadReport(city, days);

    if (cachedWeather !== null) {
      return cachedWeather;
    }
  }

  const location = await getCoordinates(city);
  const forecast = await getForecast(
    location.latitude,
    location.longitude,
    days,
  );

  return { location, forecast };
}

export async function getWeatherForCities(cities, days, noCache) {
  const weatherPromises = cities.map((city) =>
    getWeatherForCity(city, days, noCache),
  );
  const results = await Promise.allSettled(weatherPromises);

  return results.map((result, index) => ({
    city: cities[index],
    ...result,
  }));
}
