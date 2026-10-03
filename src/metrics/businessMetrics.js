import { getSafeErrorDetails, logger } from '../logger.js';
import * as metricsRepository from '../repositories/metrics.repository.js';
import {
  equipmentPlannedHours,
  equipmentRequestLoad,
  maintenanceAverageCloseHours,
  maintenanceOverdueRequests,
  maintenanceRequestsByPriority,
  maintenanceRequestsByStatus,
} from './registry.js';

const statuses = ['new', 'in_progress', 'done', 'rejected'];
const priorities = ['low', 'medium', 'high', 'critical'];

export async function collectBusinessMetrics(requestId) {
  try {
    const [requestMetrics, equipmentMetrics] = await Promise.all([
      metricsRepository.getRequestMetrics(),
      metricsRepository.getEquipmentMetrics(),
    ]);

    for (const status of statuses) {
      maintenanceRequestsByStatus.set(
        { status },
        requestMetrics.byStatus[status]
      );
    }

    for (const priority of priorities) {
      maintenanceRequestsByPriority.set(
        { priority },
        requestMetrics.byPriority[priority]
      );
    }

    maintenanceAverageCloseHours.set(requestMetrics.averageCloseHours);
    maintenanceOverdueRequests.set(requestMetrics.overdueCount);

    equipmentRequestLoad.reset();
    equipmentPlannedHours.reset();
    for (const equipment of equipmentMetrics) {
      const labels = { equipment_id: equipment.equipmentId };
      equipmentRequestLoad.set(labels, equipment.requestCount);
      equipmentPlannedHours.set(labels, equipment.plannedHours);
    }

    return true;
  } catch (error) {
    logger.error(
      {
        requestId,
        event: 'business_metrics_collection_failed',
        ...getSafeErrorDetails(error),
      },
      'Business metrics collection failed'
    );
    return false;
  }
}
