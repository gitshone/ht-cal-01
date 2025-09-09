import { User } from '@prisma/client';
import { prisma } from '../lib/prisma';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '@ht-cal-01/shared-types';

export interface CreateUserData extends CreateUserDto {
  password: string;
}

export class UserService {
  async createUser(data: CreateUserData): Promise<Omit<User, 'password'>> {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async getUserById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return users.map(({ password: _, ...user }) => user);
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password);
  }

  async getUserCount(): Promise<number> {
    return await prisma.user.count();
  }
}
