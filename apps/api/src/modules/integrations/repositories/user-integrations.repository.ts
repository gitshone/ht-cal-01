import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { BaseRepository } from '../../../shared/repositories/base.repository';

export interface CreateUserIntegrationDto {
  userId: string;
  providerType: string;
  providerId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope: string[];
}

export interface UpdateUserIntegrationDto {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string[];
  isActive?: boolean;
  lastSyncAt?: Date;
}

export interface UserIntegrationResponseDto {
  id: string;
  userId: string;
  providerType: string;
  providerId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
}

@Injectable()
export class UserIntegrationsRepository extends BaseRepository<
  UserIntegrationResponseDto,
  CreateUserIntegrationDto,
  UpdateUserIntegrationDto
> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.userIntegration;
  }

  async findByUserId(userId: string): Promise<UserIntegrationResponseDto[]> {
    return this.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserIdAndProvider(
    userId: string,
    providerType: string
  ): Promise<UserIntegrationResponseDto | null> {
    return this.findOne({
      userId,
      providerType,
    });
  }

  async findByProvider(
    providerType: string
  ): Promise<UserIntegrationResponseDto[]> {
    return this.findMany({
      where: {
        providerType,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateByUserIdAndProvider(
    userId: string,
    providerType: string,
    data: UpdateUserIntegrationDto
  ): Promise<UserIntegrationResponseDto> {
    return this.updateMany({ userId, providerType }, data).then(
      () =>
        this.findByUserIdAndProvider(
          userId,
          providerType
        ) as Promise<UserIntegrationResponseDto>
    );
  }

  async deleteByUserIdAndProvider(
    userId: string,
    providerType: string
  ): Promise<UserIntegrationResponseDto> {
    const integration = await this.findByUserIdAndProvider(
      userId,
      providerType
    );
    if (!integration) {
      throw new Error('Integration not found');
    }
    await this.delete(integration.id);
    return integration;
  }

  async isActive(userId: string, providerType: string): Promise<boolean> {
    const integration = await this.findByUserIdAndProvider(
      userId,
      providerType
    );
    return integration?.isActive ?? false;
  }

  async existsByUserIdAndProvider(
    userId: string,
    providerType: string
  ): Promise<boolean> {
    return this.existsWhere({ userId, providerType });
  }
}
