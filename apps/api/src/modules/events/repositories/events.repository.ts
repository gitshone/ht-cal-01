import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import {
  CreateEventDto,
  UpdateEventDto,
  EventResponseDto,
} from '../dtos/event.dto';

@Injectable()
export class EventsRepository extends BaseRepository<
  EventResponseDto,
  CreateEventDto,
  UpdateEventDto
> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.event;
  }

  async findByUserId(
    userId: string,
    skip: number,
    take: number
  ): Promise<{ events: EventResponseDto[]; total: number }> {
    const { data, total } = await this.findManyWithCount({
      where: { userId },
      skip,
      take,
      orderBy: { startDate: 'desc' },
    });
    return { events: data, total };
  }

  async findByUserIdAndId(
    userId: string,
    id: string
  ): Promise<EventResponseDto | null> {
    return this.findOne({
      id,
      userId,
    });
  }

  async findByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<EventResponseDto[]> {
    return this.findMany({
      where: {
        userId,
        startDate: {
          lt: endDate, // Event starts before range ends
        },
        endDate: {
          gt: startDate, // Event ends after range starts
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async findByExternalId(
    externalEventId: string,
    providerType: string
  ): Promise<EventResponseDto | null> {
    return this.findOne({
      externalEventId,
      providerType,
    });
  }

  async updateSyncTime(id: string): Promise<EventResponseDto> {
    return this.update(id, { syncedAt: new Date() } as any);
  }

  async existsByExternalId(
    externalEventId: string,
    providerType: string
  ): Promise<boolean> {
    return this.existsWhere({
      externalEventId,
      providerType,
    });
  }

  async createWithUserId(
    userId: string,
    data: CreateEventDto
  ): Promise<EventResponseDto> {
    return this.create({
      ...data,
      userId,
    } as any);
  }
}
