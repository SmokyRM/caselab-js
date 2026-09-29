import { ServiceNotReadyError } from '../errors/ServiceNotReadyError.js';
import { logger, getSafeErrorDetails } from '../logger.js';
import { serviceReady } from '../metrics/registry.js';
import { checkDatabase } from '../repositories/health.repository.js';

export function getHealth(request, response) {
  void request;
  response.status(200).json({ status: 'ok' });
}

export function getLiveness(request, response) {
  void request;
  response.status(200).json({ status: 'ok' });
}

export async function getReadiness(request, response) {
  try {
    await checkDatabase();
    serviceReady.set(1);
    response.status(200).json({ status: 'ready' });
  } catch (error) {
    serviceReady.set(0);
    logger.error(
      {
        requestId: request.id,
        event: 'database_readiness_failed',
        ...getSafeErrorDetails(error),
      },
      'Database readiness check failed'
    );
    throw new ServiceNotReadyError(error);
  }
}
