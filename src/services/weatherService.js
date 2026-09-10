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
