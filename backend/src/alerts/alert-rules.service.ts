import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';
import { UpdateAlertRuleDto } from './dto/update-alert-rule.dto';
import { AlertRule } from './entities/alert-rule.entity';

@Injectable()
export class AlertRulesService {
  constructor(
    @InjectRepository(AlertRule)
    private readonly repo: Repository<AlertRule>,
  ) {}

  create(dto: CreateAlertRuleDto): Promise<AlertRule> {
    const rule = this.repo.create({
      ...dto,
      deviceId: dto.deviceId ?? null,
      protocol: dto.protocol ?? null,
      enabled: dto.enabled ?? true,
    });
    return this.repo.save(rule);
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
    return this.repo.save(rule);
  }

  async remove(id: string): Promise<void> {
    const rule = await this.findOne(id);
    await this.repo.remove(rule);
  }
}
