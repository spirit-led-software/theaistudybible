export type DatabaseConfig = {
  readUrl: string;
  writeUrl: string;
};

export const config: DatabaseConfig = {
  readUrl:
    process.env.DATABASE_READ_URL && process.env.DATABASE_READ_URL !== ""
      ? process.env.DATABASE_READ_URL
      : process.env.DATABASE_URL!,
  writeUrl:
    process.env.DATABASE_WRITE_URL && process.env.DATABASE_WRITE_URL !== ""
      ? process.env.DATABASE_WRITE_URL!
      : process.env.DATABASE_URL!,
};

export default config;
