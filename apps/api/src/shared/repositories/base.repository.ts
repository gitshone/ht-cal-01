import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PaginatedResponseDto } from '../dto';

export interface PaginationOptions {
  skip?: number;
  take?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

export interface FindOptions extends PaginationOptions {
  where?: Record<string, any>;
  include?: Record<string, any>;
  select?: Record<string, any>;
}

@Injectable()
export abstract class BaseRepository<
  T = any,
  CreateDto = any,
  UpdateDto = any
> {
  constructor(protected prisma: PrismaService) {}

  protected abstract get model(): any;

  protected handlePrismaError(error: any, operation: string): never {
    if (error.code === 'P2002') {
      throw new Error(
        `Duplicate entry: ${operation} failed due to unique constraint violation`
      );
    }
    if (error.code === 'P2025') {
      throw new Error(
        `Record not found: ${operation} failed because the record does not exist`
      );
    }
    if (error.code === 'P2003') {
      throw new Error(
        `Foreign key constraint failed: ${operation} failed due to invalid reference`
      );
    }
    throw new Error(`${operation} failed: ${error.message}`);
  }

  async create(data: CreateDto): Promise<T> {
    try {
      return await this.model.create({
        data,
      });
    } catch (error) {
      this.handlePrismaError(error, 'create');
    }
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
    });
  }

  async findOne(where: Record<string, any>): Promise<T | null> {
    return this.model.findFirst({
      where,
    });
  }

  async findMany(options: FindOptions = {}): Promise<T[]> {
    const { where, orderBy, skip, take, include, select } = options;

    return this.model.findMany({
      where,
      orderBy,
      skip,
      take,
      include,
      select,
    });
  }

  async findAll(
    options: PaginationOptions = {}
  ): Promise<PaginatedResponseDto<T>> {
    const { skip = 0, take = 10, orderBy = { createdAt: 'desc' } } = options;

    const [data, total] = await Promise.all([
      this.model.findMany({
        skip,
        take,
        orderBy,
      }),
      this.model.count(),
    ]);

    return new PaginatedResponseDto(data, total, skip, take);
  }

  async findManyWithCount(
    options: FindOptions = {}
  ): Promise<{ data: T[]; total: number }> {
    const { where, orderBy, skip, take, include, select } = options;

    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        orderBy,
        skip,
        take,
        include,
        select,
      }),
      this.model.count({ where }),
    ]);

    return { data, total };
  }

  async update(id: string, data: UpdateDto): Promise<T> {
    try {
      return await this.model.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.handlePrismaError(error, 'update');
    }
  }

  async updateMany(
    where: Record<string, any>,
    data: UpdateDto
  ): Promise<{ count: number }> {
    try {
      return await this.model.updateMany({
        where,
        data,
      });
    } catch (error) {
      this.handlePrismaError(error, 'updateMany');
    }
  }

  async delete(id: string): Promise<T> {
    try {
      return await this.model.delete({
        where: { id },
      });
    } catch (error) {
      this.handlePrismaError(error, 'delete');
    }
  }

  async deleteMany(where: Record<string, any>): Promise<{ count: number }> {
    try {
      return await this.model.deleteMany({
        where,
      });
    } catch (error) {
      this.handlePrismaError(error, 'deleteMany');
    }
  }

  async exists(id: string): Promise<boolean> {
    const record = await this.model.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!record;
  }

  async existsWhere(where: Record<string, any>): Promise<boolean> {
    const record = await this.model.findFirst({
      where,
      select: { id: true },
    });
    return !!record;
  }

  async count(where?: Record<string, any>): Promise<number> {
    return this.model.count({ where });
  }

  async upsert(
    where: Record<string, any>,
    create: CreateDto,
    update: UpdateDto
  ): Promise<T> {
    try {
      return await this.model.upsert({
        where,
        create,
        update,
      });
    } catch (error) {
      this.handlePrismaError(error, 'upsert');
    }
  }

  async findFirstOrThrow(where: Record<string, any>): Promise<T> {
    const record = await this.model.findFirst({ where });
    if (!record) {
      throw new Error('Record not found');
    }
    return record;
  }

  async findUniqueOrThrow(where: Record<string, any>): Promise<T> {
    const record = await this.model.findUnique({ where });
    if (!record) {
      throw new Error('Record not found');
    }
    return record;
  }
}
