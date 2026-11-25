import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertEventsService } from '../alerts/alert-events.service';
import { AlertMetric } from '../alerts/entities/alert-rule.entity';
import { AlertsGateway } from '../alerts/alerts.gateway';
import { Device } from '../devices/entities/device.entity';
import { AggregateFlowsDto, BucketSize } from './dto/aggregate-flows.dto';
import { IngestFlowDto } from './dto/ingest-flow.dto';
import { QueryFlowsDto } from './dto/query-flows.dto';
import { FlowRecord } from './entities/flow-record.entity';
import { FlowsGateway } from './flows.gateway';

@Injectable()
export class FlowsService {
  constructor(
    @InjectRepository(FlowRecord)
    private readonly flowsRepo: Repository<FlowRecord>,
    @InjectRepository(Device)
    private readonly devicesRepo: Repository<Device>,
    private readonly gateway: FlowsGateway,
    private readonly alertEventsService: AlertEventsService,
    private readonly alertsGateway: AlertsGateway,
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

  async aggregate(query: AggregateFlowsDto): Promise<
    { bucket: Date; flowCount: number; totalBytes: string; totalPackets: number }[]
  > {
    const unit = query.bucket ?? BucketSize.HOUR;

    const qb = this.flowsRepo
      .createQueryBuilder('fr')
      .select(`date_trunc('${unit}', fr."startTime")`, 'bucket')
      .addSelect('COUNT(fr.id)', 'flowCount')
      .addSelect('SUM(fr.bytes)', 'totalBytes')
      .addSelect('SUM(fr.packets)', 'totalPackets')
      .groupBy(`date_trunc('${unit}', fr."startTime")`)
      .orderBy('bucket', 'ASC');

    if (query.deviceId) {
      qb.leftJoin('fr.device', 'device').where('device.id = :deviceId', {
        deviceId: query.deviceId,
      });
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

    const rows = await qb.getRawMany<{
      bucket: Date;
      flowCount: string;
      totalBytes: string;
      totalPackets: string;
    }>();
    return rows.map((r) => ({
      bucket: r.bucket,
      flowCount: parseInt(r.flowCount, 10),
      totalBytes: r.totalBytes ?? '0',
      totalPackets: parseInt(r.totalPackets, 10),
    }));
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
    this.gateway.broadcastFlows(dto.deviceId, records);

    const totalBytes = records.reduce((sum, r) => sum + r.bytes, 0);
    const totalPackets = records.reduce((sum, r) => sum + r.packets, 0);
    const flowCount = records.length;

    const fired = [
      ...(await this.alertEventsService.evaluate(dto.deviceId, AlertMetric.BYTES_PER_WINDOW, totalBytes)),
      ...(await this.alertEventsService.evaluate(dto.deviceId, AlertMetric.PACKETS_PER_WINDOW, totalPackets)),
      ...(await this.alertEventsService.evaluate(dto.deviceId, AlertMetric.FLOW_COUNT_PER_WINDOW, flowCount)),
    ];
    for (const event of fired) {
      this.alertsGateway.broadcastAlert(event);
    }

    return { received: records.length };
  }

  async topTalkers(limit = 10): Promise<
    { ip: string; direction: 'src' | 'dst'; totalBytes: string; flowCount: number }[]
  > {
    const srcRows = await this.flowsRepo
      .createQueryBuilder('fr')
      .select('fr."srcIp"', 'ip')
      .addSelect("'src'", 'direction')
      .addSelect('SUM(fr.bytes)', 'totalBytes')
      .addSelect('COUNT(fr.id)', 'flowCount')
      .groupBy('fr."srcIp"')
      .orderBy('"totalBytes"', 'DESC')
      .limit(limit)
      .getRawMany();

    const dstRows = await this.flowsRepo
      .createQueryBuilder('fr')
      .select('fr."dstIp"', 'ip')
      .addSelect("'dst'", 'direction')
      .addSelect('SUM(fr.bytes)', 'totalBytes')
      .addSelect('COUNT(fr.id)', 'flowCount')
      .groupBy('fr."dstIp"')
      .orderBy('"totalBytes"', 'DESC')
      .limit(limit)
      .getRawMany();

    return [...srcRows, ...dstRows]
      .sort((a, b) => Number(BigInt(b.totalBytes) - BigInt(a.totalBytes)))
      .slice(0, limit)
      .map((r) => ({
        ip: r.ip,
        direction: r.direction,
        totalBytes: r.totalBytes ?? '0',
        flowCount: parseInt(r.flowCount, 10),
      }));
  }
}
