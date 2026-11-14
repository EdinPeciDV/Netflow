import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AlertMetric {
  BYTES_PER_WINDOW = 'bytes_per_window',
  PACKETS_PER_WINDOW = 'packets_per_window',
  FLOW_COUNT_PER_WINDOW = 'flow_count_per_window',
}

@Entity('alert_rules')
export class AlertRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  deviceId: string | null;

  @Column({
    type: 'enum',
    enum: AlertMetric,
    default: AlertMetric.BYTES_PER_WINDOW,
  })
  metric: AlertMetric;

  @Column({ type: 'bigint' })
  threshold: number;

  @Column()
  windowSeconds: number;

  @Column({ type: 'int', nullable: true })
  protocol: number | null;

  @Column({ default: true })
  enabled: boolean;

  @Column({ type: 'int', default: 300 })
  cooldownSeconds: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
