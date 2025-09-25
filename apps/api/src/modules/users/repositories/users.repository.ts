import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
} from '../dtos/user.dto';

@Injectable()
export class UsersRepository extends BaseRepository<
  UserResponseDto,
  CreateUserDto,
  UpdateUserDto
> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.user;
  }

  async findByEmail(email: string): Promise<UserResponseDto | null> {
    return this.findOne({ email });
  }

  async findByHandle(handle: string): Promise<UserResponseDto | null> {
    return this.findOne({ handle });
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.existsWhere({ email });
  }

  async existsByHandle(handle: string): Promise<boolean> {
    return this.existsWhere({ handle });
  }

  async updateWithHandleTimestamp(
    id: string,
    data: UpdateUserDto
  ): Promise<UserResponseDto> {
    const updateData = {
      ...data,
      handleUpdatedAt: data.handle ? new Date() : undefined,
    };
    return this.update(id, updateData);
  }
}
