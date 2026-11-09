import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AlertMetric } from './alert-rule.entity';
import { AlertRule } from './alert-rule.entity';
import { Device } from '../../devices/entities/device.entity';

@Entity('alert_events')
export class AlertEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AlertRule, { onDelete: 'CASCADE', eager: false })
  alertRule: AlertRule;

  @Index()
  @Column({ type: 'uuid' })
  alertRuleId: string;

  @ManyToOne(() => Device, { onDelete: 'SET NULL', eager: false, nullable: true })
  device: Device | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  deviceId: string | null;

  @Column({ type: 'enum', enum: AlertMetric })
  metric: AlertMetric;

  @Column({ type: 'bigint' })
  value: number;

  @Index()
  @CreateDateColumn()
  triggeredAt: Date;
}
