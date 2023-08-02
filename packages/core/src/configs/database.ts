export type DatabaseConfig = {
  isLocal: boolean;
  url?: string;
};

export const config: DatabaseConfig = {
  isLocal: process.env.IS_LOCAL === "true",
  url: process.env.DATABASE_URL,
};

export default config;
