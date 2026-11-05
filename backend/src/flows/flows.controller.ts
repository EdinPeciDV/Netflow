import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IngestFlowDto } from './dto/ingest-flow.dto';
import { FlowsService } from './flows.service';

@Controller('flows')
@UseGuards(JwtAuthGuard)
export class FlowsController {
  constructor(private readonly flowsService: FlowsService) {}

  @Post('ingest')
  ingest(@Body() dto: IngestFlowDto) {
    return this.flowsService.ingest(dto);
  }
}
