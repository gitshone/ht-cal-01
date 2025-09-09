import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { ApiResponse } from '@ht-cal-01/shared-types';
import {
  MissingRequiredFieldsError,
  UserNotFoundError,
  UnknownError,
} from '../errors/http.errors';

const userService = new UserService();

export class UserController {
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await userService.getAllUsers();

      const response: ApiResponse = {
        success: true,
        data: users,
        message: 'Users retrieved successfully',
      };
      res.status(200).json(response);
    } catch {
      throw new UnknownError('Failed to fetch users. Please try again.');
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new MissingRequiredFieldsError('User ID is required');
      }

      const user = await userService.getUserById(id);

      if (!user) {
        throw new UserNotFoundError();
      }

      const response: ApiResponse = {
        success: true,
        data: user,
        message: 'User retrieved successfully',
      };
      res.status(200).json(response);
    } catch {
      throw new UnknownError('Failed to fetch user. Please try again.');
    }
  }
}
