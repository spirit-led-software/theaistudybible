import dotenv from 'dotenv';
import path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

const getConfig = (): DataSourceOptions => {
  dotenv.config({
    path: path.join(__dirname, '/../.env.local'),
  });
  return {
    type: process.env.DATABASE_TYPE as any,
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DB,
    synchronize: false,
    logging: true,
    entities: [path.join(__dirname, 'app/entities/*{.ts,.js}')],
    migrations: [path.join(__dirname, 'app/migrations/*{.ts,.js}')],
    migrationsTableName: 'migrations',
    migrationsRun: true,
  };
};

export default new DataSource(getConfig());
