export type DatabaseConfig = {
  isLocal: boolean;
  url?: string;
  resourceArn?: string;
  secretArn?: string;
  database?: string;
};

export const config: DatabaseConfig = {
  isLocal: process.env.IS_LOCAL === "true",
  url: process.env.DATABASE_URL,
  resourceArn: process.env.DATABASE_RESOURCE_ARN,
  secretArn: process.env.DATABASE_SECRET_ARN,
  database: process.env.DATABASE_NAME,
};

export default config;
