import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertEvent } from './entities/alert-event.entity';
import { AlertEventsService } from './alert-events.service';
import { AlertEventsController } from './alert-events.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AlertEvent])],
  providers: [AlertEventsService],
  controllers: [AlertEventsController],
  exports: [AlertEventsService],
})
export class AlertEventsModule {}
