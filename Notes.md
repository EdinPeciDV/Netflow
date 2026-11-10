# NetFlow — Build Log

## Project Arc (153 days / 3–5 commits per day)

| Phase | Days | Focus |
|---|---|---|
| Scaffold | 1–5 | Repo, structure, README |
| Backend core | 6–15 | Auth, users, roles, devices, ingestion API |
| Real-time layer | 16–25 | WebSockets, alerts, thresholds, Redis caching |
| Frontend core | 26–35 | Dashboard, charts, device list |
| Frontend features | 36–45 | Alert UI, filters, CSV/JSON export, dark mode |
| Quality | 46–55 | Unit tests, Swagger/OpenAPI, Docker, CI |
| Polish | 56–60 | Logging, error handling, architecture diagram |
| Advanced features | 61–70 | Anomaly detection, geo-IP, protocol breakdown, webhook/email alerts, API keys |
| Observability | 71–80 | Prometheus, Grafana stack, health monitoring, structured logging |
| Hardening | 81–90 | Security audit, rate limiting, load testing, OpenAPI export, deployment guide |
| NetFlow protocol depth | 91–100 | Real v5/v9/IPFIX UDP parser, flow aggregation, top-talkers, bandwidth trending |
| Enterprise features | 101–110 | RBAC, audit logs, SSO/OIDC stub, multi-tenant isolation, retention policies |
| Production & DevOps | 111–118 | Kubernetes + Helm, cloud deploy, staging/prod separation, secrets management |
| Release v1.0 | 119–120 | CHANGELOG, v1.0 tag, contributing guide, issue templates |
| ML/AI anomaly layer | 121–130 | Isolation Forest microservice, 7-day rolling baseline, ONNX inference, auto-threshold tuning |
| Advanced viz & PWA | 131–140 | D3.js topology map, drag-drop dashboard (react-grid-layout), PWA + push notifications, PDF export |
| Ecosystem & integrations | 141–150 | SNMP trap receiver, syslog receiver, retry-queue webhooks, OpenAPI SDK, VitePress docs, Slack bot |
| Release v2.0 | 151–153 | CHANGELOG + migration guide, k6 benchmark results, v2.0 tag |

---

## Day 1: Repo scaffold + initial setup

Initialized the git repo and set up the full-stack project structure with NestJS backend and Vite + React + TypeScript frontend. Added a root README explaining what NetFlow is and what the stack looks like. The `.gitignore` covers both workspaces. NestJS CLI scaffolded the backend with the default app module; Vite created the frontend with the react-ts template — both untouched for now, just confirmed they install and build clean.

## Day 2: NestJS module structure + env config

Introduced `@nestjs/config` and a typed env config file (`src/config/env.config.ts`) covering app, database, Redis, and JWT settings, with a `.env.example` for local setup. Broke the flat `app.module.ts` out into four dedicated modules: `HealthModule` (moved the health endpoint here with uptime reporting), `DevicesModule` (stub GET routes), `FlowsModule` (stub POST ingest endpoint), and `AuthModule` (stub login route). `AppModule` now wires them all together with `ConfigModule` globally registered. The architecture from `docs/architecture.md` is now reflected in the code layout.

## Day 3: Docker Compose for local dev

Added `docker-compose.yml` at the repo root with PostgreSQL 16-alpine and Redis 7-alpine services. Both containers have named volumes for data persistence, healthchecks, and restart policies. Updated `backend/.env.example` to use the Docker credentials (`netflow`/`netflow_dev`) so a fresh clone just needs `docker compose up -d` and a copied `.env` before running the backend.

## Day 4: TypeORM setup + User and Device entities

Bumped the backend to NestJS 11 and corrected dependency mismatches (`@nestjs/config@12` and `@typescript-eslint@8` need NestJS 11 / ESLint 9 respectively). Installed `@nestjs/typeorm`, `typeorm`, and `pg`. Wired `TypeOrmModule.forRootAsync` into `AppModule` using `ConfigService` — `synchronize: false` so schema is migration-only. Added two TypeORM entities: `User` (id, email, passwordHash, role enum, timestamps) and `Device` (id, name, ipAddress, description, owner FK to User, timestamps).

## Day 5: UsersModule, migrations foundation, and global validation

Wrapped up the scaffold phase. Created `UsersModule` — registers the User entity via `TypeOrmModule.forFeature`, provides `UsersService` (findByEmail / findById), and exports it so AuthModule can import it on Day 6. Added `src/data-source.ts`, a standalone TypeORM `DataSource` for the migrations CLI (separate from the app-level `forRootAsync`), with migration:run / revert / generate / create scripts in package.json and `ts-node` as a dev dependency. Added the first real migration (`1793448000000-InitialSchema`) that creates the `users_role_enum` type and both tables with proper constraints and `gen_random_uuid()` defaults — no extensions needed. Finally, wired `ValidationPipe({ whitelist: true, transform: true })` and `enableCors()` into `main.ts` so all future DTOs are validated and stripped at the boundary. Installed `class-validator` and `class-transformer` to back the pipe. Also extended the project arc from 120 to 153 days — see the updated arc table above.

## Day 7: User profile endpoints

Added `GET /users/me` and `PATCH /users/me` — both JWT-protected — so authenticated users can fetch and update their own profile. `UpdateProfileDto` validates an optional email change. `UsersService` gained an `update` method that writes the change and re-fetches the row. `ClassSerializerInterceptor` on the controller, combined with `@Exclude()` on the `passwordHash` column in the entity, ensures the hash never leaks in any response. `UsersModule` now declares the controller so NestJS registers the routes.

## Day 8: Roles guard and admin endpoint

Added role-based access control on top of JWT auth. Created a `@Roles()` decorator (thin `SetMetadata` wrapper) and a `RolesGuard` that reads the metadata via `Reflector` and compares the required roles against `request.user.role`. The guard returns `true` when no roles are declared so it stays non-breaking for existing routes. `UsersService` gained `findAll()`. `UsersController` now exposes `GET /users` — admin-only — guarded by the class-level `JwtAuthGuard` (authentication) plus the new `RolesGuard` (authorisation). A viewer hitting that route gets a 403.

## Day 10: Flow ingestion

Wired the flow ingestion pipeline end-to-end. Added `FlowRecordDto` (validates srcIp, dstIp, srcPort/dstPort 0–65535, protocol 0–255, bytes, packets, ISO8601 start/endTime) and `IngestFlowDto` (deviceId + nested `FlowRecordDto[]` via `@ValidateNested`). Created the `FlowRecord` TypeORM entity with indexed `device` relation and indexed `startTime` column. Added migration `1793534400000-FlowRecords` that creates the `flow_records` table with a FK to `devices` and both indexes. Rewrote `FlowsService` to look up the device by id, bulk-create all records, and return `{ received: N }`. `FlowsController` is now class-level JWT-guarded with a single `POST /flows/ingest` endpoint. `FlowsModule` imports `TypeOrmModule.forFeature([FlowRecord, Device])`.

## Day 9: Device registration

Turned the stub `DevicesModule` into real TypeORM-backed CRUD. Registered `Device` via `TypeOrmModule.forFeature` so the repository is injected. Added `RegisterDeviceDto` (`@IsString / @IsNotEmpty` for name, `@IsIP` for ipAddress) backed by the global `ValidationPipe`. Rewrote `DevicesService` with four methods: `create` (saves device with the authenticated user as owner), `findAllForUser` (admin sees every device with owner relation, viewer sees only their own), `findOne` (loads by id and throws `ForbiddenException` when a viewer tries to read another user's device), and `remove` (same ownership check then deletes). `DevicesController` is now class-level JWT-guarded with `ClassSerializerInterceptor`, exposing `POST /devices`, `GET /devices`, `GET /devices/:id`, and `DELETE /devices/:id` (204 No Content).

## Day 11: Flow query endpoints

Added read access to the ingested flow data. `QueryFlowsDto` accepts optional filters (`deviceId`, `startFrom`, `endBefore`, `protocol`) and pagination (`limit` 1–1000, `offset`) validated by the global `ValidationPipe` via `class-transformer` `@Type` decorators so query-string numbers coerce correctly. `FlowsService` gained two new methods: `findMany` builds a `QueryBuilder` with dynamic `andWhere` clauses, eager-joins the device, orders by `startTime DESC`, and returns `{ data, total }` for the caller to page through; `stats` runs a single aggregate query (`COUNT`, `SUM bytes`, `SUM packets`) with an optional `deviceId` filter. `FlowsController` exposes `GET /flows` (delegates to `findMany`) and `GET /flows/stats` (delegates to `stats`), both still covered by the class-level `JwtAuthGuard`.

## Day 12: Alert rule management

Added the alert rule CRUD layer that the real-time engine will query in Days 16–25. `AlertRule` entity stores a name, an optional `deviceId` FK (null = applies to all devices), a `metric` enum (`bytes_per_window` / `packets_per_window` / `flow_count_per_window`), a `threshold`, a `windowSeconds` evaluation window (60–86400), an optional protocol filter, and an `enabled` flag. Migration `1793620800000-AlertRules` creates the `alert_rules_metric_enum` type and the `alert_rules` table with a CASCADE FK to `devices` and an index on `deviceId`. `CreateAlertRuleDto` and `UpdateAlertRuleDto` validate all fields via `class-validator` (threshold ≥ 1, windowSeconds 60–86400, protocol 0–255). `AlertRulesService` provides `create`, `findAll`, `findOne`, `update`, and `remove` backed by the TypeORM repository. `AlertRulesController` is class-level JWT-guarded — `GET /alert-rules` and `GET /alert-rules/:id` are open to any authenticated user; `POST`, `PATCH :id`, and `DELETE :id` are additionally guarded by `RolesGuard` and require the admin role. `AlertRulesModule` exports the service so the future `AlertsModule` can inject it without re-importing the entity. Wired into `AppModule`.

## Day 13: Flow time-series aggregation

Added a time-bucketed aggregation endpoint on top of the existing flow data. `AggregateFlowsDto` accepts an optional `deviceId` (UUID filter), a `bucket` enum (`hour` / `day` / `week`, default `hour`), and optional ISO-8601 `startFrom` / `endBefore` bounds. `FlowsService.aggregate` builds a `date_trunc`-based `QueryBuilder` that groups rows by the chosen bucket and returns `flowCount`, `totalBytes`, and `totalPackets` per bucket ordered ascending — ready to feed straight into a time-series chart. `FlowsController` exposes the new `GET /flows/aggregate` route under the existing class-level `JwtAuthGuard`.

## Day 14: Alert events

Added the `AlertEvent` entity so the system can persist when a threshold is breached. The entity stores `alertRuleId` (FK → `alert_rules` CASCADE), an optional `deviceId` (FK → `devices` SET NULL), the `metric` enum, the numeric `value` that triggered the event, and a `triggeredAt` timestamp — all three FKs are individually indexed. Migration `1793707200000-AlertEvents` creates the `alert_events` table reusing the existing `alert_rules_metric_enum` type. `AlertEventsService` exposes `create`, `findAll` (filterable by `alertRuleId` and `deviceId`, paginated by `limit`), and `findOne` with a 404 guard. `AlertEventsController` wires `GET /alert-events` and `GET /alert-events/:id` behind `JwtAuthGuard`. `AlertEventsModule` exports the service so the future evaluation scheduler can inject it without reimporting the entity. Wired into `AppModule`.

## Day 15: Alert threshold evaluation

Completed the backend core phase by wiring the alert rule evaluation loop. Added `EvaluateAlertDto` (`deviceId` UUID, `metric` enum, `value` number ≥ 0) backed by `class-validator` so the global `ValidationPipe` enforces the shape at the boundary. `AlertEventsService.evaluate` queries all enabled alert rules that match the given metric and device (or are device-global with `deviceId IS NULL`), compares the measured value against each rule's threshold, and fires an `AlertEvent` row for every breach. The evaluation is intentionally synchronous — the ingestion path will call it inline in Day 16 when the WebSocket layer lands. `AlertEventsModule` now also registers `AlertRule` via `TypeOrmModule.forFeature` so the service can query rules without crossing module boundaries. `AlertEventsController` gains a `POST /alert-events/evaluate` endpoint guarded by `JwtAuthGuard` — the ingestion worker will call it internally, but it is also testable via HTTP during development. Backend core phase complete.

## Day 6: JWT authentication

Kicked off the backend core phase with full JWT auth. Installed `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, and `bcrypt` (plus their TypeScript types). Added `LoginDto` and `RegisterDto` with `class-validator` decorators so the global `ValidationPipe` enforces shape at the boundary. Created `JwtStrategy` (passport-jwt) that validates the Bearer token and resolves the user from `UsersService`. Added `JwtAuthGuard` (thin `AuthGuard('jwt')` wrapper) ready to decorate any route. Rewrote `AuthService` — `register` hashes the password with bcrypt (10 rounds) and returns an access token; `login` verifies the hash and signs the same payload `{ sub, email, role }`. Extended `UsersService` with a `create` method. Wired everything into `AuthModule` using `JwtModule.registerAsync` pulling secret and expiry from `ConfigService`.
