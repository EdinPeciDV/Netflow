import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertEvent } from './entities/alert-event.entity';
import { AlertRule } from './entities/alert-rule.entity';
import { AlertEventsService } from './alert-events.service';
import { AlertEventsController } from './alert-events.controller';
import { AlertsGateway } from './alerts.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([AlertEvent, AlertRule])],
  providers: [AlertEventsService, AlertsGateway],
  controllers: [AlertEventsController],
  exports: [AlertEventsService, AlertsGateway],
})
export class AlertEventsModule {}
