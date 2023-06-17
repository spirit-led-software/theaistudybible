export type RedisConfig = {
  host: string;
  port: number;
  password: string;
};

export const config: RedisConfig = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
};

export default config;
