import { getEquipmentWeather } from '../services/equipmentWeather.service.js';

export async function getWeather(request, response) {
  const weather = await getEquipmentWeather(
    request.validated.params.id,
    request.validated.query.days
  );

  response.status(200).json({ data: weather });
}
