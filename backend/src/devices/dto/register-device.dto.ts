import { IsIP, IsNotEmpty, IsString } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIP()
  ipAddress: string;
}
