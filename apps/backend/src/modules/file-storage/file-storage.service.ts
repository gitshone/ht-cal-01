import { BaseService } from '../../core';
import { S3Service } from '../../core/lib/s3';

export interface UploadResult {
  key: string;
  url: string;
  expiresAt: Date;
}

export class FileStorageService extends BaseService {
  async uploadLogo(
    userId: string,
    file: Express.Multer.File
  ): Promise<UploadResult> {
    try {
      const key = S3Service.generateKey(userId, file.originalname);

      await S3Service.uploadFile(key, file.buffer, file.mimetype, {
        userId,
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
      });

      const url = await S3Service.getSignedUrl(key, 7 * 24 * 3600); // 7 days
      const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

      this.logInfo(`Logo uploaded successfully for user ${userId}`, {
        key,
        originalName: file.originalname,
        size: file.size,
      });

      return {
        key,
        url,
        expiresAt,
      };
    } catch (error) {
      this.logError('Failed to upload logo', error as Error, { userId });
      throw error;
    }
  }

  async getLogoUrl(key: string): Promise<string> {
    try {
      return await S3Service.getSignedUrl(key, 7 * 24 * 3600); // 7 days
    } catch (error) {
      this.logError('Failed to get logo URL', error as Error, { key });
      throw error;
    }
  }

  async deleteLogo(key: string): Promise<void> {
    try {
      await S3Service.deleteFile(key);
      this.logInfo(`Logo deleted successfully`, { key });
    } catch (error) {
      this.logError('Failed to delete logo', error as Error, { key });
      throw error;
    }
  }

  validateImageFile(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(
        'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'
      );
    }

    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }
  }
}
