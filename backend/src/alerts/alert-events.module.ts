import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertEvent } from './entities/alert-event.entity';
import { AlertRule } from './entities/alert-rule.entity';
import { AlertEventsService } from './alert-events.service';
import { AlertEventsController } from './alert-events.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AlertEvent, AlertRule])],
  providers: [AlertEventsService],
  controllers: [AlertEventsController],
  exports: [AlertEventsService],
})
export class AlertEventsModule {}
