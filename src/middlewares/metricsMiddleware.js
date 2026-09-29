import {
  httpRequestDurationSeconds,
  httpRequestsTotal,
} from '../metrics/registry.js';

const excludedPaths = new Set(['/metrics']);
const knownRoutePatterns = [
  [
    '/api/requests/:id/assignees/:userId',
    /^\/api\/requests\/[^/]+\/assignees\/[^/]+$/,
  ],
  ['/api/requests/:id/history', /^\/api\/requests\/[^/]+\/history$/],
  ['/api/requests/:id/status', /^\/api\/requests\/[^/]+\/status$/],
  ['/api/requests/:id', /^\/api\/requests\/[^/]+$/],
  ['/api/requests', /^\/api\/requests$/],
  ['/api/equipment/:id/requests', /^\/api\/equipment\/[^/]+\/requests$/],
  ['/api/equipment/:id/weather', /^\/api\/equipment\/[^/]+\/weather$/],
  ['/api/equipment/:id', /^\/api\/equipment\/[^/]+$/],
  ['/api/equipment', /^\/api\/equipment$/],
  ['/api/sites/:id/summary', /^\/api\/sites\/[^/]+\/summary$/],
  ['/api/reports/equipment-load', /^\/api\/reports\/equipment-load$/],
  ['/api/auth/register', /^\/api\/auth\/register$/],
  ['/api/auth/login', /^\/api\/auth\/login$/],
  ['/api/auth/refresh', /^\/api\/auth\/refresh$/],
  ['/api/auth/logout', /^\/api\/auth\/logout$/],
  ['/api/auth/me', /^\/api\/auth\/me$/],
  ['/api/health/live', /^\/api\/health\/live$/],
  ['/api/health/ready', /^\/api\/health\/ready$/],
  ['/api/health', /^\/api\/health$/],
];

function getStatusClass(statusCode) {
  return `${Math.floor(statusCode / 100)}xx`;
}

export function normalizeRoute(request) {
  const knownRoute = knownRoutePatterns.find(([, pattern]) =>
    pattern.test(request.path)
  );

  if (knownRoute) return knownRoute[0];

  if (!request.route?.path) return 'unmatched';

  const routePath = Array.isArray(request.route.path)
    ? request.route.path[0]
    : request.route.path;
  const route = `${request.baseUrl}${routePath}`;

  return route.length > 1 && route.endsWith('/') ? route.slice(0, -1) : route;
}

export function metricsMiddleware(request, response, next) {
  const startedAt = process.hrtime.bigint();

  response.on('finish', () => {
    if (excludedPaths.has(request.path)) return;

    const labels = {
      method: request.method,
      route: normalizeRoute(request),
      status_class: getStatusClass(response.statusCode),
    };
    const durationSeconds =
      Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;

    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationSeconds);
  });

  next();
}
