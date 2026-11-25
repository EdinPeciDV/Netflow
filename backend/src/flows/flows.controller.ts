import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AggregateFlowsDto } from './dto/aggregate-flows.dto';
import { IngestFlowDto } from './dto/ingest-flow.dto';
import { QueryFlowsDto } from './dto/query-flows.dto';
import { FlowsService } from './flows.service';

@Controller('flows')
@UseGuards(JwtAuthGuard)
export class FlowsController {
  constructor(private readonly flowsService: FlowsService) {}

  @Post('ingest')
  ingest(@Body() dto: IngestFlowDto) {
    return this.flowsService.ingest(dto);
  }

  @Get()
  findMany(@Query() query: QueryFlowsDto) {
    return this.flowsService.findMany(query);
  }

  @Get('stats')
  stats(@Query('deviceId') deviceId?: string) {
    return this.flowsService.stats(deviceId);
  }

  @Get('aggregate')
  aggregate(@Query() query: AggregateFlowsDto) {
    return this.flowsService.aggregate(query);
  }

  @Get('top-talkers')
  topTalkers(@Query('limit') limit?: string) {
    return this.flowsService.topTalkers(limit ? parseInt(limit, 10) : undefined);
  }
}
