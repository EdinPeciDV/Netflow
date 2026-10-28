import { Injectable } from '@nestjs/common';

@Injectable()
export class FlowsService {
  ingest(deviceId: string, records: unknown[]) {
    return { deviceId, received: records.length, timestamp: new Date().toISOString() };
  }
}
