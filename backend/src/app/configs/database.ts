export type DatabaseConfig = {
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
  runMigrations: boolean;
};

export const config: DatabaseConfig = {
  type: process.env.DATABASE_TYPE,
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  name: process.env.DATABASE_NAME,
  runMigrations: process.env.RUN_DATABASE_MIGRATIONS === 'true',
};

export default config;
