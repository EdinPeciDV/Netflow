import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';
import { UpdateAlertRuleDto } from './dto/update-alert-rule.dto';
import { AlertRule, AlertMetric } from './entities/alert-rule.entity';

@Injectable()
export class AlertRulesService {
  constructor(
    @InjectRepository(AlertRule)
    private readonly repo: Repository<AlertRule>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private async invalidateRulesCache(): Promise<void> {
    await Promise.all(
      Object.values(AlertMetric).map((m) => this.cache.del(`alert-rules:${m}`)),
    );
  }

  async create(dto: CreateAlertRuleDto): Promise<AlertRule> {
    const rule = this.repo.create({
      ...dto,
      deviceId: dto.deviceId ?? null,
      protocol: dto.protocol ?? null,
      enabled: dto.enabled ?? true,
    });
    const saved = await this.repo.save(rule);
    await this.invalidateRulesCache();
    return saved;
  }

  findAll(): Promise<AlertRule[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<AlertRule> {
    const rule = await this.repo.findOneBy({ id });
    if (!rule) throw new NotFoundException('Alert rule not found');
    return rule;
  }

  async update(id: string, dto: UpdateAlertRuleDto): Promise<AlertRule> {
    const rule = await this.findOne(id);
    Object.assign(rule, dto);
    const saved = await this.repo.save(rule);
    await this.invalidateRulesCache();
    return saved;
  }

  async remove(id: string): Promise<void> {
    const rule = await this.findOne(id);
    await this.repo.remove(rule);
    await this.invalidateRulesCache();
  }
}
