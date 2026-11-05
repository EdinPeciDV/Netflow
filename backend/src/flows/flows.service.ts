import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../devices/entities/device.entity';
import { IngestFlowDto } from './dto/ingest-flow.dto';
import { FlowRecord } from './entities/flow-record.entity';

@Injectable()
export class FlowsService {
  constructor(
    @InjectRepository(FlowRecord)
    private readonly flowsRepo: Repository<FlowRecord>,
    @InjectRepository(Device)
    private readonly devicesRepo: Repository<Device>,
  ) {}

  async ingest(dto: IngestFlowDto): Promise<{ received: number }> {
    const device = await this.devicesRepo.findOne({
      where: { id: dto.deviceId },
    });
    if (!device) throw new NotFoundException('Device not found');

    const records = dto.records.map((r) =>
      this.flowsRepo.create({
        device,
        srcIp: r.srcIp,
        dstIp: r.dstIp,
        srcPort: r.srcPort,
        dstPort: r.dstPort,
        protocol: r.protocol,
        bytes: r.bytes,
        packets: r.packets,
        startTime: new Date(r.startTime),
        endTime: new Date(r.endTime),
      }),
    );

    await this.flowsRepo.save(records);
    return { received: records.length };
  }
}
