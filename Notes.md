# NetFlow — Build Log

## Day 1: Repo scaffold + initial setup

Initialized the git repo and set up the full-stack project structure with NestJS backend and Vite + React + TypeScript frontend. Added a root README explaining what NetFlow is and what the stack looks like. The `.gitignore` covers both workspaces. NestJS CLI scaffolded the backend with the default app module; Vite created the frontend with the react-ts template — both untouched for now, just confirmed they install and build clean.

## Day 2: NestJS module structure + env config

Introduced `@nestjs/config` and a typed env config file (`src/config/env.config.ts`) covering app, database, Redis, and JWT settings, with a `.env.example` for local setup. Broke the flat `app.module.ts` out into four dedicated modules: `HealthModule` (moved the health endpoint here with uptime reporting), `DevicesModule` (stub GET routes), `FlowsModule` (stub POST ingest endpoint), and `AuthModule` (stub login route). `AppModule` now wires them all together with `ConfigModule` globally registered. The architecture from `docs/architecture.md` is now reflected in the code layout.

## Day 3: Docker Compose for local dev

Added `docker-compose.yml` at the repo root with PostgreSQL 16-alpine and Redis 7-alpine services. Both containers have named volumes for data persistence, healthchecks, and restart policies. Updated `backend/.env.example` to use the Docker credentials (`netflow`/`netflow_dev`) so a fresh clone just needs `docker compose up -d` and a copied `.env` before running the backend.

## Day 4: TypeORM setup + User and Device entities

Bumped the backend to NestJS 11 and corrected dependency mismatches (`@nestjs/config@12` and `@typescript-eslint@8` need NestJS 11 / ESLint 9 respectively). Installed `@nestjs/typeorm`, `typeorm`, and `pg`. Wired `TypeOrmModule.forRootAsync` into `AppModule` using `ConfigService` — `synchronize: false` so schema is migration-only. Added two TypeORM entities: `User` (id, email, passwordHash, role enum, timestamps) and `Device` (id, name, ipAddress, description, owner FK to User, timestamps).
