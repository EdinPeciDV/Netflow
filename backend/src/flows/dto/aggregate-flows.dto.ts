import { IsEnum, IsISO8601, IsOptional, IsUUID } from 'class-validator';

export enum BucketSize {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
}

export class AggregateFlowsDto {
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @IsOptional()
  @IsEnum(BucketSize)
  bucket?: BucketSize;

  @IsOptional()
  @IsISO8601()
  startFrom?: string;

  @IsOptional()
  @IsISO8601()
  endBefore?: string;
}
