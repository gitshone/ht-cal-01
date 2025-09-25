import { Module } from '@nestjs/common';
import { SettingsService } from './services/settings.service';
import { SettingsController } from './controllers/settings.controller';
import { SettingsRepository } from './repositories/settings.repository';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { FileStorageService } from '../../infrastructure/file-storage/file-storage.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SettingsController],
  providers: [SettingsService, SettingsRepository, FileStorageService],
  exports: [SettingsService, SettingsRepository],
})
export class SettingsModule {}
