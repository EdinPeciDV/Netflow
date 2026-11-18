# NetFlow

A real-time network traffic monitoring dashboard built over 153 days.

## What is NetFlow?

NetFlow is a full-stack application for monitoring network traffic in real time. It ingests flow data from network devices, processes it through a NestJS backend, and visualizes it on a React dashboard with live charts, alerting, and historical analysis.

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS (Node.js + TypeScript) |
| Frontend | React + TypeScript + Vite |
| Real-time | WebSockets |
| Database | PostgreSQL |
| Cache | Redis |

## Features (planned)

- Device registration and management
- Real-time traffic ingestion via REST + WebSockets
- Live bandwidth and packet-rate charts
- Configurable alert thresholds
- Historical data queries with date-range filtering
- Role-based access control
- JWT-authenticated WebSocket gateways (`/flows`, `/alerts`)
- Per-device Socket.io room subscriptions on `/flows` (rate-limited)
- Alert cooldown / deduplication backed by Redis
- Dark mode UI
- Docker / docker-compose deployment
- GitHub Actions CI

## Project Structure

```
netflow/
├── backend/    # NestJS API server
├── frontend/   # React + Vite dashboard
└── Notes.md    # Daily build log
```

## Running Locally

```bash
# Start PostgreSQL and Redis
docker compose up -d

# Backend (NestJS)
cd backend && npm install && npm run start:dev

# Frontend (React + Vite), in a second terminal
cd frontend && npm install && npm run dev
```
