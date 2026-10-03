# Week 4 Requirements Matrix

## Mandatory

| Requirement                  | Implementation                                      | Evidence                                   | Status |
| ---------------------------- | --------------------------------------------------- | ------------------------------------------ | ------ |
| Password security            | scrypt + salt + timing-safe compare                 | `src/security/password.js`, auth tests     | PASS   |
| Access authentication        | Short-lived JWT Bearer token                        | `src/security/tokens.js`, OpenAPI          | PASS   |
| Refresh sessions             | Opaque token, DB hash, rotation/revocation          | auth service/repository, integration tests | PASS   |
| Secure cookie controls       | HttpOnly, configurable Secure/SameSite/name         | cookies config, Postman assertions         | PASS   |
| Generic login errors         | Unknown email and wrong password share response     | integration/Postman tests                  | PASS   |
| Login and API rate limits    | Separate login limiter and general limiter          | middleware, Postman                        | PASS   |
| RBAC                         | viewer/technician/admin middleware + service checks | routes, services, Jest/Newman              | PASS   |
| Assignment authorization     | Technician status change only when assigned         | request transaction + tests                | PASS   |
| Database persistence         | PostgreSQL + Sequelize models                       | migrations/models                          | PASS   |
| Transactional status/history | Row lock, request update and history insert         | request service/repository tests           | PASS   |
| Transactional assignees      | Atomic team replacement                             | request service/repository                 | PASS   |
| Production image             | Node 20 multi-stage, prod deps, non-root            | `Dockerfile`                               | PASS   |
| Compose deployment           | PostgreSQL, migrate, API, monitoring, Nginx         | `docker-compose.prod.yml`                  | PASS   |
| Nginx gateway                | Static UI, API/Grafana proxy, metrics block         | `nginx/nginx.conf`, HTTP smoke             | PASS   |
| Health checks                | health/live/ready with DB readiness                 | controllers, DB-failure audit              | PASS   |
| Structured logging           | requestId, method, path, status, duration           | Pino middleware, log correlation           | PASS   |
| Metrics                      | RED, readiness and business metrics                 | registry, Prometheus audit                 | PASS   |
| Dashboard                    | Provisioned `caselab-week4-overview`                | Grafana provisioning, 13 panels            | PASS   |
| Alert rule                   | `ServiceNotReady`, 1 minute, warning                | Prometheus rule, firing/recovery audit     | PASS   |
| Automated tests              | Unit + integration with isolated PostgreSQL         | 51/51, 6 suites                            | PASS   |
| API documentation            | OpenAPI 3.0.3 + Swagger                             | 20 paths, 26 operations, 29 schemas        | PASS   |
| End-to-end collection        | Postman/Newman through Nginx                        | 47 requests, 90 assertions                 | PASS   |
| Operational docs             | Deployment guide and runbook                        | `docs/DEPLOYMENT.md`, `docs/RUNBOOK.md`    | PASS   |
| Frontend demo                | Vanilla UI, auth restore, roles, equipment/requests | `frontend/`, Nginx static smoke            | PASS   |

Mandatory total: **24 PASS, 0 PARTIAL, 0 NOT IMPLEMENTED**.

## Bonus / non-mandatory

| Bonus                            | Current state                                                             | Evidence                      | Status          |
| -------------------------------- | ------------------------------------------------------------------------- | ----------------------------- | --------------- |
| HTTPS termination                | Not configured in current Compose                                         | README/deployment limitations | NOT IMPLEMENTED |
| CI pipeline                      | No CI workflow                                                            | repository audit              | NOT IMPLEMENTED |
| requestId Nginx -> Grafana trace | API response/log correlation exists; no end-to-end Grafana log datasource | Runbook and runtime log audit | PARTIAL         |
| Nginx static caching policy      | HTML no-cache; no immutable/versioned asset policy                        | Nginx config                  | NOT IMPLEMENTED |
| Load testing                     | No dedicated load-test scenario or results                                | repository audit              | NOT IMPLEMENTED |
| Alert delivery                   | Rule exists, Alertmanager is absent                                       | Prometheus config             | PARTIAL         |

Bonus total: **0 PASS, 2 PARTIAL, 4 NOT IMPLEMENTED**.
