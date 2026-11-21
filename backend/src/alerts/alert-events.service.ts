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
      if (value <= rule.threshold) continue;

      // Suppress duplicate alerts for the same rule+device while the rule's
      // cooldown is active, preventing alert storms when every ingest batch
      // keeps breaching the threshold. cooldownSeconds <= 0 disables it.
      const cooldownKey = `alert-cooldown:${rule.id}:${deviceId}`;
      if (rule.cooldownSeconds > 0) {
        const onCooldown = await this.cache.get(cooldownKey);
        if (onCooldown) continue;
      }

      fired.push(
        await this.create({ alertRuleId: rule.id, deviceId, metric, value }),
      );

      if (rule.cooldownSeconds > 0) {
        await this.cache.set(cooldownKey, 1, rule.cooldownSeconds * 1000);
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

  async acknowledge(id: string): Promise<AlertEvent | null> {
    const event = await this.repo.findOne({ where: { id } });
    if (!event) return null;
    if (event.acknowledgedAt) return event;
    event.acknowledgedAt = new Date();
    return this.repo.save(event);
  }
}
