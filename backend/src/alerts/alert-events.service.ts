import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertEvent } from './entities/alert-event.entity';
import { AlertRule, AlertMetric } from './entities/alert-rule.entity';

@Injectable()
export class AlertEventsService {
  constructor(
    @InjectRepository(AlertEvent)
    private readonly repo: Repository<AlertEvent>,
    @InjectRepository(AlertRule)
    private readonly rulesRepo: Repository<AlertRule>,
  ) {}

  async evaluate(
    deviceId: string,
    metric: AlertMetric,
    value: number,
  ): Promise<AlertEvent[]> {
    const rules = await this.rulesRepo
      .createQueryBuilder('r')
      .where('r.enabled = :enabled', { enabled: true })
      .andWhere('r.metric = :metric', { metric })
      .andWhere('(r.deviceId = :deviceId OR r.deviceId IS NULL)', { deviceId })
      .getMany();

    const fired: AlertEvent[] = [];
    for (const rule of rules) {
      if (value > rule.threshold) {
        fired.push(
          await this.create({ alertRuleId: rule.id, deviceId, metric, value }),
        );
      }
    }
    return fired;
  }

  async create(data: {
    alertRuleId: string;
    deviceId: string | null;
    metric: AlertMetric;
    value: number;
  }): Promise<AlertEvent> {
    const event = this.repo.create(data);
    return this.repo.save(event);
  }

  async findAll(
    alertRuleId?: string,
    deviceId?: string,
    limit = 100,
  ): Promise<{ data: AlertEvent[]; total: number }> {
    const qb = this.repo
      .createQueryBuilder('ae')
      .orderBy('ae.triggeredAt', 'DESC')
      .take(limit);

    if (alertRuleId) {
      qb.andWhere('ae.alertRuleId = :alertRuleId', { alertRuleId });
    }
    if (deviceId) {
      qb.andWhere('ae.deviceId = :deviceId', { deviceId });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<AlertEvent> {
    const event = await this.repo.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Alert event not found');
    return event;
  }
}
