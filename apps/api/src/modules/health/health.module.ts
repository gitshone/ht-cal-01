import { Module } from '@nestjs/common';
import { HealthService } from './services/health.service';
import { HealthController } from './controllers/health.controller';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import { QueueModule } from '../../infrastructure/queue/queue.module';
import { FileStorageModule } from '../file-storage/file-storage.module';

@Module({
  imports: [DatabaseModule, CacheModule, QueueModule, FileStorageModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
