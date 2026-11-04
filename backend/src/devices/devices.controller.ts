import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { DevicesService } from './devices.service';

@Controller('devices')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  create(
    @Body() dto: RegisterDeviceDto,
    @Request() req: { user: User },
  ) {
    return this.devicesService.create(dto, req.user);
  }

  @Get()
  findAll(@Request() req: { user: User }) {
    return this.devicesService.findAllForUser(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: { user: User }) {
    return this.devicesService.findOne(id, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Request() req: { user: User }) {
    return this.devicesService.remove(id, req.user);
  }
}
