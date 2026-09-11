import { PRECIPITATION_UNIT, TEMPERATURE_UNIT } from '../config.js';

export function formatWeather(weather) {
  const { location, forecast } = weather;
  const temperatureLabel = TEMPERATURE_UNIT === 'fahrenheit' ? '°F' : '°C';
  const precipitationLabel = PRECIPITATION_UNIT === 'inch' ? 'дюйм.' : 'мм';

  const tableHeader = [
    'Дата'.padEnd(13),
    'Мин.'.padEnd(11),
    'Макс.'.padEnd(11),
    'Осадки',
  ].join('');

  const forecastRows = forecast.map((day) =>
    [
      day.date.padEnd(13),
      `${day.minTemperature} ${temperatureLabel}`.padEnd(11),
      `${day.maxTemperature} ${temperatureLabel}`.padEnd(11),
      `${day.precipitation} ${precipitationLabel}`,
    ].join('')
  );

  return [
    `${location.name}, ${location.country}`,
    `Координаты: ${location.latitude}, ${location.longitude}`,
    '',
    tableHeader,
    ...forecastRows,
  ].join('\n');
}
