import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { BullModule } from '@nestjs/bull';
import { AppConfigService } from '../../core/config/app-config.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (config: AppConfigService) => ({
        redis: {
          host: config.redisHost,
          port: config.redisPort,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      }),
      inject: [AppConfigService],
    }),
  ],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
