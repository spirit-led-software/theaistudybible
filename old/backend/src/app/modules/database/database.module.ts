import { DatabaseConfig, GeneralConfig, RedisConfig } from '@configs/types';
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
        const generalConfig: GeneralConfig = configService.get('general');
        const ssl =
          generalConfig.environment === 'production'
            ? { rejectUnauthorized: false }
            : undefined;
        return {
          type: 'postgres',
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
          ssl,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
