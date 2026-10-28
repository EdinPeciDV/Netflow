import { Body, Controller, Param, Post } from '@nestjs/common';
import { FlowsService } from './flows.service';

@Controller('flows')
export class FlowsController {
  constructor(private readonly flowsService: FlowsService) {}

  @Post(':deviceId/ingest')
  ingest(@Param('deviceId') deviceId: string, @Body() body: { records: unknown[] }) {
    return this.flowsService.ingest(deviceId, body.records ?? []);
  }
}
