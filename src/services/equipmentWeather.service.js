import { getForecast } from '../api/openMeteo.js';
import {
  OUTDOOR_MAX_PRECIPITATION,
  OUTDOOR_MAX_WIND_SPEED,
} from '../config.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import * as equipmentRepository from '../repositories/equipment.repository.js';

export async function getEquipmentWeather(id, days) {
  const equipment = await equipmentRepository.findById(id);

  if (!equipment) {
    throw new NotFoundError('Оборудование не найдено.', 'EQUIPMENT_NOT_FOUND');
  }

  const forecast = await getForecast(
    equipment.location.lat,
    equipment.location.lon,
    days,
    { precipitationUnit: 'mm' }
  );

  const forecastWithSuitability = forecast.map((day) => ({
    ...day,
    suitableForOutdoorWork:
      day.precipitation <= OUTDOOR_MAX_PRECIPITATION &&
      day.maxWindSpeed <= OUTDOOR_MAX_WIND_SPEED,
  }));

  return {
    equipmentId: equipment.id,
    location: equipment.location,
    rules: {
      maxPrecipitation: OUTDOOR_MAX_PRECIPITATION,
      maxWindSpeed: OUTDOOR_MAX_WIND_SPEED,
      precipitationUnit: 'mm',
      windSpeedUnit: 'km/h',
    },
    outdoorWorkSuitable: forecastWithSuitability.every(
      (day) => day.suitableForOutdoorWork
    ),
    forecast: forecastWithSuitability,
  };
}
