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

## Day 6: JWT authentication

Kicked off the backend core phase with full JWT auth. Installed `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, and `bcrypt` (plus their TypeScript types). Added `LoginDto` and `RegisterDto` with `class-validator` decorators so the global `ValidationPipe` enforces shape at the boundary. Created `JwtStrategy` (passport-jwt) that validates the Bearer token and resolves the user from `UsersService`. Added `JwtAuthGuard` (thin `AuthGuard('jwt')` wrapper) ready to decorate any route. Rewrote `AuthService` — `register` hashes the password with bcrypt (10 rounds) and returns an access token; `login` verifies the hash and signs the same payload `{ sub, email, role }`. Extended `UsersService` with a `create` method. Wired everything into `AuthModule` using `JwtModule.registerAsync` pulling secret and expiry from `ConfigService`.
