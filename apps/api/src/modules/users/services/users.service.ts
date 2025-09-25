import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
} from '../dtos/user.dto';
import { PaginatedResponseDto } from '../../../shared/dto';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      return await this.usersRepository.create(createUserDto);
    } catch (error: any) {
      if (error.message.includes('Duplicate entry')) {
        throw new ConflictException('Email or handle already exists');
      }
      throw error;
    }
  }

  async findAll(
    skip = 0,
    take = 10
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    return this.usersRepository.findAll({ skip, take });
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserResponseDto | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findByHandle(handle: string): Promise<UserResponseDto | null> {
    return this.usersRepository.findByHandle(handle);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    try {
      return await this.usersRepository.updateWithHandleTimestamp(
        id,
        updateUserDto
      );
    } catch (error: any) {
      if (error.message.includes('Duplicate entry')) {
        throw new ConflictException('Email or handle already exists');
      }
      if (error.message.includes('Record not found')) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<UserResponseDto> {
    try {
      return await this.usersRepository.delete(id);
    } catch (error: any) {
      if (error.message.includes('Record not found')) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }
}
