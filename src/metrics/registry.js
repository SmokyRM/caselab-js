import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from 'prom-client';

export const registry = new Registry();

collectDefaultMetrics({ register: registry });

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of completed HTTP requests.',
  labelNames: ['method', 'route', 'status_class'],
  registers: [registry],
});

export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds.',
  labelNames: ['method', 'route', 'status_class'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
});

export const httpErrorsTotal = new Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors handled by the application.',
  labelNames: ['route', 'error_code'],
  registers: [registry],
});

export const serviceReady = new Gauge({
  name: 'service_ready',
  help: 'Whether the service database dependency is ready.',
  registers: [registry],
});

export const maintenanceRequestsByStatus = new Gauge({
  name: 'maintenance_requests_by_status',
  help: 'Current maintenance request count by status.',
  labelNames: ['status'],
  registers: [registry],
});

export const maintenanceRequestsByPriority = new Gauge({
  name: 'maintenance_requests_by_priority',
  help: 'Current maintenance request count by priority.',
  labelNames: ['priority'],
  registers: [registry],
});

export const maintenanceAverageCloseHours = new Gauge({
  name: 'maintenance_average_close_hours',
  help: 'Average hours from request creation to its first terminal transition.',
  registers: [registry],
});

export const maintenanceOverdueRequests = new Gauge({
  name: 'maintenance_overdue_requests',
  help: 'Current overdue non-terminal maintenance request count.',
  registers: [registry],
});

export const equipmentRequestLoad = new Gauge({
  name: 'equipment_request_load',
  help: 'Current maintenance request count for an equipment item.',
  labelNames: ['equipment_id'],
  registers: [registry],
});

export const equipmentPlannedHours = new Gauge({
  name: 'equipment_planned_hours',
  help: 'Current planned maintenance hours for an equipment item.',
  labelNames: ['equipment_id'],
  registers: [registry],
});
