import { postgresConfig, redisConfig } from '@configs';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

export const config: TypeOrmModuleOptions = {
  type: postgresConfig.type,
  host: postgresConfig.host,
  port: postgresConfig.port,
  username: postgresConfig.username,
  password: postgresConfig.password,
  database: postgresConfig.database,
  synchronize: false,
  entities: [__dirname + '/../entities/*{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  migrationsRun: process.env.RUN_DATABASE_MIGRATIONS === 'true',
  cache: {
    type: 'redis',
    options: {
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
    },
  },
};

const getConfig = (): DataSourceOptions => {
  dotenvConfig();
  return {
    type: 'postgres',
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT),
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    synchronize: false,
    logging: true,
    entities: [__dirname + '/../entities/*{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    migrationsTableName: 'migrations',
    migrationsRun: true,
  };
};

export default new DataSource(getConfig());
