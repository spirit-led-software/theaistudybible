export type RedisConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
};

export const config: RedisConfig = {
  host: process.env.REDIS_HOST as string,
  port: parseInt(process.env.REDIS_PORT as string),
  username: process.env.REDIS_USERNAME as string,
  password: process.env.REDIS_PASSWORD as string,
};

export default config;
