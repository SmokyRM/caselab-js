import { collectBusinessMetrics } from '../metrics/businessMetrics.js';
import { registry } from '../metrics/registry.js';

export async function getMetrics(request, response) {
  await collectBusinessMetrics(request.id);
  response.set('Content-Type', registry.contentType);
  response.status(200).send(await registry.metrics());
}
