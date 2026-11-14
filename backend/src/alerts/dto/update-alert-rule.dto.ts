import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { AlertMetric } from '../entities/alert-rule.entity';

export class UpdateAlertRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  deviceId?: string | null;

  @IsOptional()
  @IsEnum(AlertMetric)
  metric?: AlertMetric;

  @IsOptional()
  @IsInt()
  @Min(1)
  threshold?: number;

  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(86400)
  windowSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(255)
  protocol?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400)
  cooldownSeconds?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
