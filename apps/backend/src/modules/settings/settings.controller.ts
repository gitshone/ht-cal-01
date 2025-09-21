import { Request, Response } from 'express';
import { BaseController } from '../../core/base.controller';
import { SettingsService } from './settings.service';
import multer from 'multer';
import {
  UpdateUserSettingsDto,
  CreateUnavailabilityBlockDto,
  UpdateUnavailabilityBlockDto,
} from '@ht-cal-01/shared-types';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export class SettingsController extends BaseController {
  constructor(private settingsService: SettingsService) {
    super();
  }

  async getUserSettings(req: Request, res: Response): Promise<void> {
    const userId = this.getUserId(req);

    try {
      const settings = await this.settingsService.getUserSettings(userId);
      this.sendSuccess(res, settings, 'User settings retrieved successfully');
    } catch (error) {
      this.sendError(res, 'Failed to retrieve user settings', 500);
    }
  }

  async updateUserSettings(req: Request, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const data: UpdateUserSettingsDto = req.body;

    try {
      const settings = await this.settingsService.updateUserSettings(
        userId,
        data
      );
      this.sendSuccess(res, settings, 'User settings updated successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update user settings';
      this.sendError(res, errorMessage, 400);
    }
  }

  async deleteUserSettings(req: Request, res: Response): Promise<void> {
    const userId = this.getUserId(req);

    try {
      await this.settingsService.deleteUserSettings(userId);
      this.sendSuccess(res, null, 'User settings deleted successfully');
    } catch (error) {
      this.sendError(res, 'Failed to delete user settings', 500);
    }
  }

  // Unavailability Blocks endpoints
  async createUnavailabilityBlock(req: Request, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const data: CreateUnavailabilityBlockDto = req.body;

    try {
      const block = await this.settingsService.createUnavailabilityBlock(
        userId,
        data
      );
      this.sendSuccess(res, block, 'Unavailability block created successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to create unavailability block';
      this.sendError(res, errorMessage, 400);
    }
  }

  async updateUnavailabilityBlock(req: Request, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const blockId = req.params.id;
    const data: UpdateUnavailabilityBlockDto = req.body;

    try {
      const block = await this.settingsService.updateUnavailabilityBlock(
        blockId,
        userId,
        data
      );
      this.sendSuccess(res, block, 'Unavailability block updated successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update unavailability block';
      this.sendError(res, errorMessage, 400);
    }
  }

  async deleteUnavailabilityBlock(req: Request, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const blockId = req.params.id;

    try {
      await this.settingsService.deleteUnavailabilityBlock(blockId, userId);
      this.sendSuccess(res, null, 'Unavailability block deleted successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to delete unavailability block';
      this.sendError(res, errorMessage, 400);
    }
  }

  async getUserUnavailabilityBlocks(
    req: Request,
    res: Response
  ): Promise<void> {
    const userId = this.getUserId(req);

    try {
      const blocks = await this.settingsService.getUserUnavailabilityBlocks(
        userId
      );
      this.sendSuccess(
        res,
        blocks,
        'Unavailability blocks retrieved successfully'
      );
    } catch (error) {
      this.sendError(res, 'Failed to retrieve unavailability blocks', 500);
    }
  }

  async uploadLogo(req: Request, res: Response): Promise<void> {
    const userId = this.getUserId(req);

    if (!req.file) {
      this.sendError(res, 'No file uploaded', 400);
      return;
    }

    try {
      const settings = await this.settingsService.uploadLogo(userId, req.file);
      this.sendSuccess(res, settings, 'Logo uploaded successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to upload logo';
      this.sendError(res, errorMessage, 400);
    }
  }

  async deleteLogo(req: Request, res: Response): Promise<void> {
    const userId = this.getUserId(req);

    try {
      const settings = await this.settingsService.deleteLogo(userId);
      this.sendSuccess(res, settings, 'Logo deleted successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete logo';
      this.sendError(res, errorMessage, 400);
    }
  }

  getUploadMiddleware() {
    return upload.single('logo');
  }
}
