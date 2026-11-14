import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { AlertMetric } from '../entities/alert-rule.entity';

export class CreateAlertRuleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @IsEnum(AlertMetric)
  metric: AlertMetric;

  @IsInt()
  @Min(1)
  threshold: number;

  @IsInt()
  @Min(60)
  @Max(86400)
  windowSeconds: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(255)
  protocol?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400)
  cooldownSeconds?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
