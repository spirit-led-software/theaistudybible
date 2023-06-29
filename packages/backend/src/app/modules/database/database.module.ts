import { DatabaseConfig, RedisConfig } from '@configs/types';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import path from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const dbConfig: DatabaseConfig = configService.get('database');
        const redisConfig: RedisConfig = configService.get('redis');
        return {
          type: dbConfig.type as any,
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.name,
          synchronize: false,
          entities: [path.join(__dirname, '../../entities/*{.ts,.js}')],
          migrations: [path.join(__dirname, '../../migrations/*{.ts,.js}')],
          migrationsTableName: 'migrations',
          migrationsRun: dbConfig.runMigrations,
          cache: {
            type: 'ioredis',
            options: {
              host: redisConfig.host,
              port: redisConfig.port,
              password: redisConfig.password,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
