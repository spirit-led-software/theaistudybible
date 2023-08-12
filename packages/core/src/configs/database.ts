export type DatabaseConfig = {
  readOnlyUrl: string;
  readWriteUrl: string;
};

export const config: DatabaseConfig = {
  readOnlyUrl:
    process.env.DATABASE_READONLY_URL || process.env.DATABASE_READWRITE_URL!,
  readWriteUrl: process.env.DATABASE_READWRITE_URL!,
};

export default config;
