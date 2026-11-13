import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AlertEvent } from './entities/alert-event.entity';
import { AlertRule, AlertMetric } from './entities/alert-rule.entity';

@Injectable()
export class AlertEventsService {
  constructor(
    @InjectRepository(AlertEvent)
    private readonly repo: Repository<AlertEvent>,
    @InjectRepository(AlertRule)
    private readonly rulesRepo: Repository<AlertRule>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async evaluate(
    deviceId: string,
    metric: AlertMetric,
    value: number,
  ): Promise<AlertEvent[]> {
    const cacheKey = `alert-rules:${metric}`;
    let rules = await this.cache.get<AlertRule[]>(cacheKey);
    if (!rules) {
      rules = await this.rulesRepo.find({ where: { enabled: true, metric } });
      await this.cache.set(cacheKey, rules, 30_000);
    }
    const applicable = rules.filter(
      (r) => r.deviceId === null || r.deviceId === deviceId,
    );

    const fired: AlertEvent[] = [];
    for (const rule of applicable) {
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
