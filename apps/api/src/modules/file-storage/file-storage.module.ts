import { Module } from '@nestjs/common';
import { FileStorageController } from './controllers/file-storage.controller';
import { FileStorageService } from '../../infrastructure/file-storage/file-storage.service';

@Module({
  controllers: [FileStorageController],
  providers: [FileStorageService],
  exports: [FileStorageService],
})
export class FileStorageModule {}
