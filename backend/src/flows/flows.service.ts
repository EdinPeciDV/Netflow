import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../devices/entities/device.entity';
import { IngestFlowDto } from './dto/ingest-flow.dto';
import { QueryFlowsDto } from './dto/query-flows.dto';
import { FlowRecord } from './entities/flow-record.entity';

@Injectable()
export class FlowsService {
  constructor(
    @InjectRepository(FlowRecord)
    private readonly flowsRepo: Repository<FlowRecord>,
    @InjectRepository(Device)
    private readonly devicesRepo: Repository<Device>,
  ) {}

  async findMany(
    query: QueryFlowsDto,
  ): Promise<{ data: FlowRecord[]; total: number }> {
    const qb = this.flowsRepo
      .createQueryBuilder('fr')
      .leftJoinAndSelect('fr.device', 'device')
      .orderBy('fr.startTime', 'DESC')
      .take(query.limit ?? 100)
      .skip(query.offset ?? 0);

    if (query.deviceId) {
      qb.andWhere('device.id = :deviceId', { deviceId: query.deviceId });
    }
    if (query.protocol !== undefined) {
      qb.andWhere('fr.protocol = :protocol', { protocol: query.protocol });
    }
    if (query.startFrom) {
      qb.andWhere('fr.startTime >= :startFrom', {
        startFrom: new Date(query.startFrom),
      });
    }
    if (query.endBefore) {
      qb.andWhere('fr.startTime < :endBefore', {
        endBefore: new Date(query.endBefore),
      });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async stats(deviceId?: string): Promise<{
    deviceId: string | null;
    flowCount: number;
    totalBytes: string;
    totalPackets: number;
  }> {
    const qb = this.flowsRepo
      .createQueryBuilder('fr')
      .select('COUNT(fr.id)', 'flowCount')
      .addSelect('SUM(fr.bytes)', 'totalBytes')
      .addSelect('SUM(fr.packets)', 'totalPackets');

    if (deviceId) {
      qb.leftJoin('fr.device', 'device').where('device.id = :deviceId', {
        deviceId,
      });
    }

    const raw = await qb.getRawOne<{
      flowCount: string;
      totalBytes: string;
      totalPackets: string;
    }>();

    return {
      deviceId: deviceId ?? null,
      flowCount: parseInt(raw?.flowCount ?? '0', 10),
      totalBytes: raw?.totalBytes ?? '0',
      totalPackets: parseInt(raw?.totalPackets ?? '0', 10),
    };
  }

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
