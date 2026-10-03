import { components } from './components.js';
import { paths } from './paths.js';

export const openapiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'CaseLab Maintenance Service API',
    version: '4.0.0',
    description: `Maintenance service API with PostgreSQL persistence, authentication, role-based access control, equipment and maintenance request management, analytics, and health endpoints.

Roles:
- viewer: read access to protected resources;
- technician: viewer access plus request creation/update; status changes only for assigned requests;
- admin: equipment administration, request deletion, team assignment, and request status operations.

Refresh tokens are opaque values stored only in an HttpOnly cookie. They are not Bearer JWTs and are never returned in JSON. The cookie is Secure in production and uses the configured SameSite policy (production default: Lax).

Prometheus metrics are exposed internally at /metrics inside the Docker network and are blocked by Nginx externally. API and login rate limits are configurable through environment variables. JSON request bodies are limited to 100 KB.`,
  },
  servers: [
    {
      url: '/',
      description: 'Current origin (works directly and through Nginx)',
    },
    {
      url: 'http://localhost:8080',
      description: 'Local production stack through Nginx',
    },
  ],
  tags: [
    { name: 'Health', description: 'Public health and readiness probes.' },
    {
      name: 'Authentication',
      description: 'Registration and session lifecycle.',
    },
    { name: 'Equipment', description: 'Equipment inventory and weather.' },
    {
      name: 'Maintenance Requests',
      description: 'Requests, status history, and assigned teams.',
    },
    { name: 'Analytics', description: 'PostgreSQL-backed aggregate reports.' },
    {
      name: 'Operations',
      description:
        'Operational behavior. Prometheus /metrics is internal-only and intentionally omitted from public paths.',
    },
  ],
  paths,
  components,
};

export default openapiDocument;
