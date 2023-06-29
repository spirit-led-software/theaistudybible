import { RedisConfig } from '@configs/types';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const config: RedisConfig = configService.get('redis');
        return {
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
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class QueueModule {}
