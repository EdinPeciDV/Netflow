# NetFlow — Build Log

## Day 1: Repo scaffold + initial setup

Initialized the git repo and set up the full-stack project structure with NestJS backend and Vite + React + TypeScript frontend. Added a root README explaining what NetFlow is and what the stack looks like. The `.gitignore` covers both workspaces. NestJS CLI scaffolded the backend with the default app module; Vite created the frontend with the react-ts template — both untouched for now, just confirmed they install and build clean.

## Day 2: NestJS module structure + env config

Introduced `@nestjs/config` and a typed env config file (`src/config/env.config.ts`) covering app, database, Redis, and JWT settings, with a `.env.example` for local setup. Broke the flat `app.module.ts` out into four dedicated modules: `HealthModule` (moved the health endpoint here with uptime reporting), `DevicesModule` (stub GET routes), `FlowsModule` (stub POST ingest endpoint), and `AuthModule` (stub login route). `AppModule` now wires them all together with `ConfigModule` globally registered. The architecture from `docs/architecture.md` is now reflected in the code layout.
