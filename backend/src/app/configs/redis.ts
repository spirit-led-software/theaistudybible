type RedisConfig = {
  host: string;
  port: number;
  password: string;
};

export const config: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
};

export default config;
