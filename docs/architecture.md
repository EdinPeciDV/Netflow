# NetFlow — Architecture

## Overview

```
[ Network Device ]
        |
        | HTTP POST /api/flows
        v
[ NestJS Backend ]
        |
        |-- PostgreSQL (persist flow records)
        |-- Redis (cache aggregated metrics)
        |-- WebSocket gateway (push live updates)
        v
[ React Frontend ]
        |
        |-- Real-time charts (WebSocket subscription)
        |-- Device management UI
        |-- Alert configuration
        |-- Historical query views
```

## Backend Modules

| Module | Responsibility |
|--------|----------------|
| `AuthModule` | JWT-based authentication, role definitions |
| `UsersModule` | User accounts and role assignment |
| `DevicesModule` | Device registration and metadata |
| `FlowsModule` | Ingestion endpoint, storage, aggregation |
| `AlertsModule` | Threshold rules, evaluation, firing |
| `MetricsModule` | Real-time aggregated stats, WebSocket push |
| `HistoryModule` | Time-range queries over stored flow data |

## Data Flow

1. A registered device POSTs a batch of flow records to `/api/flows/ingest`
2. The `FlowsModule` validates the payload, writes raw records to PostgreSQL
3. An aggregation job (or inline) updates Redis counters (bytes/s, packets/s per device)
4. The `MetricsModule` WebSocket gateway pushes the updated snapshot to all subscribed clients
5. If any aggregated value crosses a threshold, `AlertsModule` fires and broadcasts an alert event

## Frontend Structure

```
src/
├── api/          # Typed fetch wrappers for REST endpoints
├── ws/           # WebSocket client and subscription hooks
├── components/   # Reusable UI elements
├── pages/        # Route-level views (Dashboard, Devices, Alerts, History)
├── store/        # Global state (devices, alerts, live metrics)
└── theme/        # Design tokens, dark/light mode
```

## Infrastructure

- **Database:** PostgreSQL — flow records, devices, users, alert rules
- **Cache:** Redis — aggregated per-device metrics (TTL-based, fast WebSocket reads)
- **Runtime:** Docker + docker-compose for local dev and self-hosted deployment
- **CI:** GitHub Actions — lint, typecheck, unit tests on every push

## Security

- All API routes require a valid JWT (except `/auth/login`)
- Roles: `admin` (full access), `viewer` (read-only dashboard)
- Device tokens: devices use a separate pre-shared key to POST flow data
