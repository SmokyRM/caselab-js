# CaseLab Maintenance Service Deployment

## Prerequisites

- Git;
- Docker Engine or Docker Desktop;
- Docker Compose v2;
- available host port `8080` or a custom `NGINX_PORT`.

Node.js and npm are optional on the host when only the containerized stack is used.

## Environment Setup

```bash
git clone https://github.com/SmokyRM/caselab-js.git
cd caselab-js
cp .env.example .env
```

Required production values:

```dotenv
DB_PASSWORD=<strong-random-password>
JWT_ACCESS_SECRET=<random-secret-at-least-32-characters>
GRAFANA_ADMIN_PASSWORD=<strong-random-password>
```

`JWT_ACCESS_SECRET` must contain at least 32 characters and must not use the example placeholder. Review CORS, cookie, proxy, Grafana URL and rate-limit settings for the target environment.

## Stack Architecture

Nginx publishes the host port and proxies API and Grafana. API, PostgreSQL, Prometheus and Grafana use the internal Compose network and are not host-published.

Named volumes:

- `postgres_data_prod`;
- `prometheus_data`;
- `grafana_data`.

## From-zero Startup

Optional host tooling:

```bash
npm ci
```

Build and start the stack:

```bash
docker compose -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.prod.yml ps
```

The `migrate` service applies pending migrations. API startup is gated by PostgreSQL health and successful migration completion.

## Optional Demo Seeds

Seeds are not part of normal startup. For a local demo or Newman verification:

```bash
docker compose -f docker-compose.prod.yml --profile tools run --rm seed
```

Seeds are not idempotent and include clearly marked demo technician/admin accounts. They are not production account provisioning.

## Service URLs

With default `NGINX_PORT=8080`:

- frontend UI: `http://localhost:8080/`;
- API: `http://localhost:8080`;
- health: `http://localhost:8080/api/health`;
- readiness: `http://localhost:8080/api/health/ready`;
- Swagger: `http://localhost:8080/api/docs/`;
- raw OpenAPI: `http://localhost:8080/api/docs/openapi.json`;
- Grafana: `http://localhost:8080/grafana/`.

Prometheus and `/metrics` are internal-only.

For a local HTTP frontend demo only, use `NODE_ENV=development AUTH_COOKIE_SECURE=false` so the browser can send the refresh cookie without TLS. Do not use those overrides for a real deployment; production remains the Compose default.

```bash
NODE_ENV=development AUTH_COOKIE_SECURE=false docker compose -f docker-compose.prod.yml up --build -d
```

## Validation

```bash
curl --fail http://localhost:8080/api/health
curl --fail http://localhost:8080/api/health/ready
curl --fail http://localhost:8080/api/docs/openapi.json
docker compose -f docker-compose.prod.yml ps
```

For a seeded local demo:

```bash
npm run test:postman
```

## Migrations

Inspect migration output:

```bash
docker compose -f docker-compose.prod.yml logs migrate
```

Run pending migrations explicitly with the same image and environment:

```bash
docker compose -f docker-compose.prod.yml run --rm migrate npm run db:migrate
```

Roll back one migration only after reviewing compatibility and data impact:

```bash
docker compose -f docker-compose.prod.yml run --rm migrate npm run db:migrate:undo
```

Do not modify the production schema manually.

## Shutdown and Persistence

Stop containers while retaining named volumes:

```bash
docker compose -f docker-compose.prod.yml down
```

The following command also deletes PostgreSQL, Prometheus and Grafana data and must not be used without explicit intent and a backup:

```bash
docker compose -f docker-compose.prod.yml down -v
```

Automated backup/restore is outside the current project scope.

## Upgrade

```bash
git pull --ff-only
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
```

Migrations gate API startup. This procedure does not promise zero downtime.

## Rollback Notes

Code rollback does not automatically roll back the database. Before reverting code, check whether it can operate with the current schema. Before migration rollback, inspect data loss and compatibility. Do not perform destructive rollback automatically.

## HTTPS Requirement

The current Compose configuration does not terminate TLS. A real deployment must provide HTTPS before Nginx or configure TLS on Nginx. Production refresh cookies use `Secure` and therefore require HTTPS. Localhost HTTP is suitable only for local demonstration.
