# NetFlow — Vision

## Problem

Network engineers and DevOps teams need real-time visibility into their traffic. Most existing tools are either expensive commercial products or CLI-heavy tools with no live dashboard. There's a gap for a self-hostable, clean, open-source alternative that shows what's happening on your network right now.

## What NetFlow Does

NetFlow is a real-time traffic monitoring dashboard. Devices report flow data to the backend, which aggregates and pushes live metrics to the frontend over WebSockets. Operators see current bandwidth, packet rates, top talkers, and alert conditions in a single view.

## Goals

1. **Real-time first** — every metric should update live, no page refresh required
2. **Self-hosted** — runs entirely on-premises, no cloud dependency
3. **Multi-device** — register and monitor many network devices from one dashboard
4. **Alerting** — configurable thresholds that fire when traffic exceeds limits
5. **History** — query past traffic data with flexible date ranges
6. **Clean UI** — dark/light mode, responsive, readable at a glance

## Target Users

- Small-to-medium businesses managing their own network infrastructure
- Homelab enthusiasts who want real monitoring without a per-device license fee
- DevOps teams who need a lightweight traffic dashboard alongside their existing stack

## Out of Scope (v1)

- Deep packet inspection
- Full NetFlow/IPFIX protocol parsing (v1 uses a simplified REST ingestion model)
- Multi-tenant SaaS hosting
