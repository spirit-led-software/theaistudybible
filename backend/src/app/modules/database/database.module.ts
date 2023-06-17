import { DatabaseConfig, RedisConfig } from '@configs/types';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
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
          entities: [__dirname + '/../entities/*{.ts,.js}'],
          migrations: [__dirname + '/../migrations/*{.ts,.js}'],
          migrationsTableName: 'migrations',
          migrationsRun: dbConfig.runMigrations,
          cache: {
            type: 'redis',
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
