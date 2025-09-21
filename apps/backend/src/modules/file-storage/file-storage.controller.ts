import { Request, Response } from 'express';
import { BaseController } from '../../core/base.controller';
import { FileStorageService } from './file-storage.service';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export class FileStorageController extends BaseController {
  constructor(private fileStorageService: FileStorageService) {
    super();
  }

  async uploadLogo(req: Request, res: Response): Promise<void> {
    const userId = this.getUserId(req);

    if (!req.file) {
      this.sendError(res, 'No file uploaded', 400);
      return;
    }

    try {
      this.fileStorageService.validateImageFile(req.file);
      const result = await this.fileStorageService.uploadLogo(userId, req.file);
      this.sendSuccess(res, result, 'Logo uploaded successfully');
    } catch (error) {
      this.sendError(
        res,
        error instanceof Error ? error.message : 'Upload failed',
        400
      );
    }
  }

  async getLogoUrl(req: Request, res: Response): Promise<void> {
    const { key } = req.params;

    try {
      const url = await this.fileStorageService.getLogoUrl(key);
      this.sendSuccess(res, { url }, 'Logo URL retrieved successfully');
    } catch (_error) {
      this.sendError(res, 'Logo not found', 404);
    }
  }

  async deleteLogo(req: Request, res: Response): Promise<void> {
    const { key } = req.params;

    try {
      await this.fileStorageService.deleteLogo(key);
      this.sendSuccess(res, null, 'Logo deleted successfully');
    } catch (_error) {
      this.sendError(res, 'Failed to delete logo', 500);
    }
  }

  getUploadMiddleware() {
    return upload.single('logo');
  }
}
