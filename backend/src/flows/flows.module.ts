import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertEventsModule } from '../alerts/alert-events.module';
import { Device } from '../devices/entities/device.entity';
import { FlowRecord } from './entities/flow-record.entity';
import { FlowsController } from './flows.controller';
import { FlowsGateway } from './flows.gateway';
import { FlowsService } from './flows.service';

@Module({
  imports: [TypeOrmModule.forFeature([FlowRecord, Device]), AlertEventsModule],
  controllers: [FlowsController],
  providers: [FlowsService, FlowsGateway],
})
export class FlowsModule {}
