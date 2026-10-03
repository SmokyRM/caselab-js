# CaseLab Maintenance Service Runbook

## 1. Service Overview

The production-like stack contains Nginx, Node.js API, PostgreSQL, Prometheus and Grafana. Nginx is the only host-published service. API logs are structured JSON on stdout.

Automated database backup and restore are outside the current project scope. Never remove volumes before confirming backup and recovery consequences.

## 2. First Checks

```bash
docker compose -f docker-compose.prod.yml ps
curl --fail http://localhost:8080/api/health
curl --fail http://localhost:8080/api/health/live
curl --fail http://localhost:8080/api/health/ready
```

Expected healthy state: all containers are running, liveness and readiness return HTTP 200, and readiness returns `{"status":"ready"}`.

## 3. Logs and Request Correlation

```bash
docker compose -f docker-compose.prod.yml logs api
docker compose -f docker-compose.prod.yml logs nginx
docker compose -f docker-compose.prod.yml logs postgres
docker compose -f docker-compose.prod.yml logs prometheus
docker compose -f docker-compose.prod.yml logs grafana
```

API errors contain `requestId`; API structured logs include the same value. Search API logs by that ID. Do not assume Nginx creates or propagates this ID independently.

## 4. Metrics

Open Grafana at `http://localhost:8080/grafana/`. Dashboard `CaseLab Service Overview` has UID `caselab-week4-overview`.

Prometheus is internal-only. Inspect its targets from inside the container:

```bash
docker compose -f docker-compose.prod.yml exec prometheus wget -qO- http://localhost:9090/api/v1/targets
```

## 5. Database Unavailable

Symptoms:

- `/api/health/live` remains HTTP 200;
- `/api/health/ready` becomes HTTP 503;
- `service_ready` becomes `0`;
- `ServiceNotReady` becomes pending and then firing after one minute.

Checks:

```bash
docker compose -f docker-compose.prod.yml ps postgres
docker compose -f docker-compose.prod.yml logs postgres
docker compose -f docker-compose.prod.yml logs api
```

Restore PostgreSQL connectivity, then verify readiness returns HTTP 200, `service_ready` returns to `1`, and the alert becomes inactive.

## 6. Elevated 5xx

In Grafana inspect Error Share, Application Errors and P95 latency. Correlate `requestId` and `error_code` with API logs. Check PostgreSQL and, for weather-only errors, Open-Meteo connectivity. Do not treat an external weather failure as proof that PostgreSQL or the whole API is down.

## 7. ServiceNotReady Alert

Rule: `service_ready == 0` for one minute, severity `warning`.

1. Confirm readiness is HTTP 503.
2. Inspect PostgreSQL state and logs.
3. Inspect API logs.
4. Restore database connectivity.
5. Verify readiness is HTTP 200 and `service_ready` is `1`.
6. Verify the alert is inactive.

Alertmanager is not configured, so notification delivery is outside this project.

## 8. Disk and Storage

```bash
docker system df
docker volume ls
docker compose -f docker-compose.prod.yml ps
```

PostgreSQL, Prometheus and Grafana use named volumes. Do not use `docker system prune -a` as a first response and do not delete volumes without a backup and an explicit understanding of data loss.

## 9. Migration Failure

The API depends on successful completion of the `migrate` service. If migration exits non-zero, the API does not start.

```bash
docker compose -f docker-compose.prod.yml ps migrate
docker compose -f docker-compose.prod.yml logs migrate
```

Fix the migration or configuration problem; do not edit the schema manually.

## 10. Migration Rollback

The migration image includes sequelize-cli. Roll back one migration only after checking code/schema compatibility:

```bash
docker compose -f docker-compose.prod.yml run --rm migrate npm run db:migrate:undo
```

Code rollback and database rollback are separate operations. Never automate a destructive migration rollback without reviewing affected data.

## 11. Authentication Issues

- `401`: check Bearer syntax, access-token expiry and signing-secret consistency.
- refresh failure: check cookie presence, expiry, revocation/rotation, cookie name and SameSite settings.
- a Secure cookie requires HTTPS in a real deployment; localhost HTTP is only a demo exception.
- `403`: check the user role. For technician status changes, also check that the technician is assigned to the request.

Never log access or refresh tokens.

## 12. Grafana Unavailable

```bash
docker compose -f docker-compose.prod.yml ps nginx grafana prometheus
docker compose -f docker-compose.prod.yml logs nginx
docker compose -f docker-compose.prod.yml logs grafana
docker compose -f docker-compose.prod.yml logs prometheus
```

Check `GRAFANA_ROOT_URL`, subpath serving and the Prometheus datasource. Grafana is exposed only through Nginx at `/grafana/`.

## 13. Recovery Verification

```bash
docker compose -f docker-compose.prod.yml ps
curl --fail http://localhost:8080/api/health/live
curl --fail http://localhost:8080/api/health/ready
curl --fail http://localhost:8080/api/docs/openapi.json
```

Confirm the affected user flow, inspect Grafana, and verify no alert remains active.

## 14. DB Password Mismatch After Changing `.env`

`POSTGRES_PASSWORD` is applied only when PostgreSQL initializes a new empty data volume. Changing `DB_PASSWORD` in `.env` does not change the role password inside an existing database cluster, so the API can start failing with password authentication errors.

Safe options:

- restore the original password used to initialize the volume;
- deliberately change the PostgreSQL role password using an authorized database procedure;
- for a disposable local demo only, recreate the stack and its volume from zero.

`docker compose ... down -v` permanently deletes the data in named volumes. It is not a production password-recovery procedure and must never be suggested without an explicit data-loss decision and a verified backup.

## 15. Local Frontend Demo

For a localhost HTTP demo:

- include the frontend origin in `CORS_ORIGINS`, for example `http://localhost:8080`;
- set `AUTH_COOKIE_SECURE=false` only because localhost uses HTTP;
- run the demo seed once to create demo admin and technician users;
- keep the production default `AUTH_COOKIE_SECURE=true` and use HTTPS for real deployment.

If login succeeds but refresh fails, inspect the cookie attributes, origin, environment mode and API logs before changing application code.
