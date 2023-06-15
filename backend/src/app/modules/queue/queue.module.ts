import { config } from '@configs/redis';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: config.host,
        port: config.port,
        password: config.password,
      },
      settings: {
        retryProcessDelay: 3000,
        backoffStrategies: {
          custom: (attempts: number) => {
            return 1000 * attempts;
          },
        },
      },
    }),
  ],
})
export class QueueModule {}
