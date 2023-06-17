import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: configService.get('database.type') as any,
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name') as string,
        synchronize: false,
        entities: [__dirname + '/../entities/*{.ts,.js}'],
        migrations: [__dirname + '/../migrations/*{.ts,.js}'],
        migrationsTableName: 'migrations',
        migrationsRun: configService.get('database.runMigrations'),
        cache: {
          type: 'redis',
          options: {
            host: configService.get('redis.host'),
            port: configService.get('redis.port'),
            password: configService.get('redis.password'),
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
