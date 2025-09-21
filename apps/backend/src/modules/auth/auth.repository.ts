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
    handle?: string;
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
            handle: userData.handle,
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

  async findByHandle(handle: string): Promise<User | null> {
    return this.executeQuery(
      'findUnique',
      'user',
      () =>
        this.prisma.user.findUnique({
          where: { handle },
        }),
      { handle }
    ) as Promise<User | null>;
  }

  async updateHandle(id: string, handle: string): Promise<User> {
    return this.executeQuery(
      'update',
      'user',
      () =>
        this.prisma.user.update({
          where: { id },
          data: {
            handle,
            handleUpdatedAt: new Date(),
          },
        }),
      { id, handle }
    ) as Promise<User>;
  }

  async generateUniqueHandle(email: string): Promise<string> {
    // Extract username from email (part before @)
    let baseHandle = email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric characters
      .substring(0, 20); // Limit to 20 characters

    // Handle edge cases
    if (baseHandle.length === 0) {
      baseHandle = 'user';
    } else if (baseHandle.length < 3) {
      baseHandle = `${baseHandle}user`;
    }

    // Ensure it doesn't start with a number (for better UX)
    if (/^[0-9]/.test(baseHandle)) {
      baseHandle = `user${baseHandle}`;
    }

    let handle = baseHandle;
    let counter = 1;

    // Keep trying until we find a unique handle
    while (true) {
      const existingUser = await this.findByHandle(handle);
      if (!existingUser) {
        return handle;
      }

      // Add counter to make it unique
      handle = `${baseHandle}${counter}`;
      counter++;

      // Prevent infinite loop (safety measure)
      if (counter > 9999) {
        // Fallback: use timestamp
        handle = `${baseHandle}${Date.now().toString().slice(-4)}`;
        const finalCheck = await this.findByHandle(handle);
        if (!finalCheck) {
          return handle;
        }
        // If even timestamp fails, throw error
        throw new Error('Unable to generate unique handle');
      }
    }
  }
}
