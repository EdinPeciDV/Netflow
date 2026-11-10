import { IsEnum, IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';
import { AlertMetric } from '../entities/alert-rule.entity';

export class EvaluateAlertDto {
  @IsUUID()
  @IsNotEmpty()
  deviceId: string;

  @IsEnum(AlertMetric)
  metric: AlertMetric;

  @IsNumber()
  @Min(0)
  value: number;
}
