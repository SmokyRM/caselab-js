export function formatWeather(weather) {
  const { location, forecast } = weather;

  const tableHeader = [
    'Дата'.padEnd(13),
    'Мин.'.padEnd(11),
    'Макс.'.padEnd(11),
    'Осадки',
  ].join('');

  const forecastRows = forecast.map((day) =>
    [
      day.date.padEnd(13),
      `${day.minTemperature} °C`.padEnd(11),
      `${day.maxTemperature} °C`.padEnd(11),
      `${day.precipitation} мм`,
    ].join(''),
  );

  return [
    `${location.name}, ${location.country}`,
    `Координаты: ${location.latitude}, ${location.longitude}`,
    '',
    tableHeader,
    ...forecastRows,
  ].join('\n');
}
