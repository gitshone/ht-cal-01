import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppConfigService } from '../../core/config/app-config.service';

export interface UploadResult {
  key: string;
  url: string;
  expiresAt: Date;
}

@Injectable()
export class FileStorageService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private config: AppConfigService) {
    // Only initialize S3Client if credentials are provided
    if (
      this.config.awsAccessKeyId &&
      this.config.awsSecretAccessKey &&
      this.config.awsRegion
    ) {
      const s3Config: any = {
        region: this.config.awsRegion,
        credentials: {
          accessKeyId: this.config.awsAccessKeyId,
          secretAccessKey: this.config.awsSecretAccessKey,
        },
      };

      // Add endpoint for MinIO if configured
      if (this.config.s3Endpoint) {
        s3Config.endpoint = this.config.s3Endpoint;
        s3Config.forcePathStyle = true; // Required for MinIO
      }

      this.s3Client = new S3Client(s3Config);

      console.log('S3Client initialized', {
        region: this.config.awsRegion,
        endpoint: this.config.s3Endpoint || 'AWS S3',
        bucket: this.config.awsS3Bucket,
      });
    } else {
      console.warn('S3Client not initialized - missing credentials:', {
        hasAccessKey: !!this.config.awsAccessKeyId,
        hasSecretKey: !!this.config.awsSecretAccessKey,
        hasRegion: !!this.config.awsRegion,
        hasEndpoint: !!this.config.s3Endpoint,
      });
    }
    this.bucketName = this.config.awsS3Bucket;
  }

  async uploadLogo(userId: string, file: any): Promise<UploadResult> {
    if (!this.s3Client) {
      throw new Error(
        'S3Client not initialized. Please check AWS credentials configuration.'
      );
    }

    try {
      this.validateImageFile(file);

      const key = this.generateKey(userId, file.originalname);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          userId,
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      const url = await this.getSignedUrl(key, 7 * 24 * 3600); // 7 days
      const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

      console.log(`Logo uploaded successfully for user ${userId}`, {
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
      console.error('Failed to upload logo', error, { userId });
      throw error;
    }
  }

  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string
  ): Promise<UploadResult> {
    if (!this.s3Client) {
      throw new Error(
        'S3Client not initialized. Please check AWS credentials configuration.'
      );
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      const url = await this.getSignedUrl(key, 7 * 24 * 3600); // 7 days
      const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

      console.log(`File uploaded successfully`, {
        key,
        contentType,
        size: buffer.length,
      });

      return {
        key,
        url,
        expiresAt,
      };
    } catch (error) {
      console.error('Failed to upload file', error, { key });
      throw error;
    }
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    if (!this.s3Client) {
      throw new Error(
        'S3Client not initialized. Please check AWS credentials configuration.'
      );
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Failed to get signed URL', error, { key });
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    if (!this.s3Client) {
      throw new Error(
        'S3Client not initialized. Please check AWS credentials configuration.'
      );
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      console.log(`File deleted successfully: ${key}`);
    } catch (error) {
      console.error('Failed to delete file', error, { key });
      throw error;
    }
  }

  private generateKey(userId: string, filename: string): string {
    const timestamp = Date.now();
    const extension = filename.split('.').pop();
    return `users/${userId}/logos/${timestamp}.${extension}`;
  }

  validateImageFile(file: any): void {
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
