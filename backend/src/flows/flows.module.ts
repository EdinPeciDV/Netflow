import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from '../devices/entities/device.entity';
import { FlowRecord } from './entities/flow-record.entity';
import { FlowsController } from './flows.controller';
import { FlowsService } from './flows.service';

@Module({
  imports: [TypeOrmModule.forFeature([FlowRecord, Device])],
  controllers: [FlowsController],
  providers: [FlowsService],
})
export class FlowsModule {}
