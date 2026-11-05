import { Type } from 'class-transformer';
import {
  IsIP,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class FlowRecordDto {
  @IsIP()
  srcIp: string;

  @IsIP()
  dstIp: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  srcPort: number;

  @IsInt()
  @Min(0)
  @Max(65535)
  dstPort: number;

  @IsInt()
  @Min(0)
  @Max(255)
  protocol: number;

  @IsInt()
  @Min(0)
  bytes: number;

  @IsInt()
  @Min(0)
  packets: number;

  @IsISO8601()
  startTime: string;

  @IsISO8601()
  endTime: string;
}

export class IngestFlowDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ValidateNested({ each: true })
  @Type(() => FlowRecordDto)
  records: FlowRecordDto[];
}
