# NetFlow — Data Model

## Core Entities

### User
```
id          uuid PK
email       string unique
password    string (hashed)
role        enum('admin', 'viewer')
createdAt   timestamp
```

### Device
```
id          uuid PK
name        string
description string
ipAddress   string
token       string (hashed, used for flow ingestion auth)
ownerId     uuid FK -> User
createdAt   timestamp
lastSeenAt  timestamp
```

### FlowRecord
```
id          uuid PK
deviceId    uuid FK -> Device
srcIp       string
dstIp       string
srcPort     int
dstPort     int
protocol    string
bytes       bigint
packets     int
startTime   timestamp
endTime     timestamp
recordedAt  timestamp
```

### AlertRule
```
id          uuid PK
deviceId    uuid FK -> Device (null = applies to all)
metric      enum('bytes_per_sec', 'packets_per_sec')
threshold   float
window      int (seconds)
severity    enum('warning', 'critical')
createdAt   timestamp
```

### AlertEvent
```
id          uuid PK
ruleId      uuid FK -> AlertRule
deviceId    uuid FK -> Device
value       float
firedAt     timestamp
resolvedAt  timestamp nullable
```

## Aggregated Metrics (Redis, not persisted in DB)

Per device, updated on each ingestion batch:

```
netflow:metrics:{deviceId} -> {
  bytesPerSec:   number,
  packetsPerSec: number,
  topSrcIps:     string[],
  topDstIps:     string[],
  updatedAt:     ISO timestamp
}
```

TTL: 30 seconds (device is considered offline if no update in 30s)
