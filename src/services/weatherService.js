import { getCoordinates, getForecast } from '../api/openMeteo.js';

export async function getWeatherForCity(city, days) {
  const location = await getCoordinates(city);
  const forecast = await getForecast(
    location.latitude,
    location.longitude,
    days,
  );

  return { location, forecast };
}

export async function getWeatherForCities(cities, days) {
  const weatherPromises = cities.map((city) =>
    getWeatherForCity(city, days),
  );
  const results = await Promise.allSettled(weatherPromises);

  return results.map((result, index) => ({
    city: cities[index],
    ...result,
  }));
}
