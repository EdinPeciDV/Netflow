import { Injectable } from '@nestjs/common';

@Injectable()
export class DevicesService {
  findAll() {
    return [];
  }

  findOne(id: string) {
    return { id };
  }
}
