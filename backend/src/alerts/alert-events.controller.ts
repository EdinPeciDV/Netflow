import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AlertEventsService } from './alert-events.service';
import { EvaluateAlertDto } from './dto/evaluate-alert.dto';

@Controller('alert-events')
@UseGuards(JwtAuthGuard)
export class AlertEventsController {
  constructor(private readonly service: AlertEventsService) {}

  @Post('evaluate')
  evaluate(@Body() dto: EvaluateAlertDto) {
    return this.service.evaluate(dto.deviceId, dto.metric, dto.value);
  }

  @Get()
  findAll(
    @Query('alertRuleId') alertRuleId?: string,
    @Query('deviceId') deviceId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(alertRuleId, deviceId, limit ? +limit : 100);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }
}
