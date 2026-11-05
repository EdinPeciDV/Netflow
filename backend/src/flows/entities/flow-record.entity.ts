import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Device } from '../../devices/entities/device.entity';

@Entity('flow_records')
export class FlowRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Device, { nullable: true, onDelete: 'SET NULL' })
  device: Device | null;

  @Column()
  srcIp: string;

  @Column()
  dstIp: string;

  @Column()
  srcPort: number;

  @Column()
  dstPort: number;

  @Column()
  protocol: number;

  @Column({ type: 'bigint' })
  bytes: number;

  @Column()
  packets: number;

  @Index()
  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'timestamptz' })
  endTime: Date;

  @CreateDateColumn()
  createdAt: Date;
}
