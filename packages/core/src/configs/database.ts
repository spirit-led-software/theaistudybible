export type DatabaseConfig = {
  readOnlyUrl: string;
  readWriteUrl: string;
};

export const config: DatabaseConfig = {
  readOnlyUrl:
    process.env.DATABASE_READ_URL && process.env.DATABASE_READ_URL !== ""
      ? process.env.DATABASE_READ_URL
      : process.env.DATABASE_URL!,
  readWriteUrl:
    process.env.DATABASE_WRITE_URL && process.env.DATABASE_WRITE_URL !== ""
      ? process.env.DATABASE_WRITE_URL!
      : process.env.DATABASE_URL!,
};

export default config;
