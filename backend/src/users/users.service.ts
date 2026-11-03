import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

interface CreateUserInput {
  email: string;
  passwordHash: string;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepo.find();
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  create(input: CreateUserInput): Promise<User> {
    const user = this.usersRepo.create(input);
    return this.usersRepo.save(user);
  }

  async update(id: string, changes: Pick<Partial<User>, 'email'>): Promise<User> {
    await this.usersRepo.update(id, changes);
    const updated = await this.usersRepo.findOne({ where: { id } });
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }
}
