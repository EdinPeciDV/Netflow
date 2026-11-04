import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../users/entities/user.entity';
import { User } from '../users/entities/user.entity';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { Device } from './entities/device.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly devicesRepo: Repository<Device>,
  ) {}

  create(dto: RegisterDeviceDto, owner: User): Promise<Device> {
    const device = this.devicesRepo.create({ ...dto, owner });
    return this.devicesRepo.save(device);
  }

  findAllForUser(user: User): Promise<Device[]> {
    if (user.role === UserRole.ADMIN) {
      return this.devicesRepo.find({ relations: ['owner'] });
    }
    return this.devicesRepo.find({
      where: { owner: { id: user.id } },
      relations: ['owner'],
    });
  }

  async findOne(id: string, user: User): Promise<Device> {
    const device = await this.devicesRepo.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!device) throw new NotFoundException('Device not found');
    if (user.role !== UserRole.ADMIN && device.owner?.id !== user.id) {
      throw new ForbiddenException();
    }
    return device;
  }

  async remove(id: string, user: User): Promise<void> {
    const device = await this.findOne(id, user);
    await this.devicesRepo.remove(device);
  }
}
