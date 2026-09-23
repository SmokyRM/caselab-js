import * as analyticsService from '../services/analytics.service.js';

export async function getSiteSummary(request, response) {
  const summary = await analyticsService.getSiteSummary(
    request.validated.params.id
  );
  response.status(200).json({ data: summary });
}

export async function getEquipmentLoad(request, response) {
  const query = request.validated.query;
  const report = await analyticsService.getEquipmentLoad(query);

  response.status(200).json({
    data: report,
    meta: query,
  });
}
