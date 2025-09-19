import { BaseRepository } from '../../core/base.repository';
import { User } from '@ht-cal-01/shared-types';

export class AuthRepository extends BaseRepository {
  async findByEmail(email: string): Promise<User | null> {
    return this.executeQuery(
      'findUnique',
      'user',
      () =>
        this.prisma.user.findUnique({
          where: { email },
        }),
      { email }
    ) as Promise<User | null>;
  }

  async findById(id: string): Promise<User | null> {
    return this.executeQuery(
      'findUnique',
      'user',
      () =>
        this.prisma.user.findUnique({
          where: { id },
        }),
      { id }
    ) as Promise<User | null>;
  }

  async create(userData: {
    email: string;
    firstName: string;
    lastName: string;
    googleOauthTokens?: any;
  }): Promise<User> {
    return this.executeQuery(
      'create',
      'user',
      () =>
        this.prisma.user.create({
          data: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            googleOauthTokens: userData.googleOauthTokens,
          },
        }),
      { email: userData.email }
    ) as Promise<User>;
  }

  async updateGoogleTokens(id: string, tokens: any): Promise<void> {
    await this.executeQuery(
      'update',
      'user',
      () =>
        this.prisma.user.update({
          where: { id },
          data: { googleOauthTokens: tokens },
        }),
      { id }
    );
  }

  async deleteUser(id: string): Promise<void> {
    await this.executeQuery(
      'delete',
      'user',
      () =>
        this.prisma.user.delete({
          where: { id },
        }),
      { id }
    );
  }
}

export const authRepository = new AuthRepository();
