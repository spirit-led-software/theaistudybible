export type DatabaseConfig = {
  url: string;
};

export const config: DatabaseConfig = {
  url: process.env.DATABASE_URL!,
};

export default config;
