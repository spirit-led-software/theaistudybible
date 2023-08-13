import type { Config } from "drizzle-kit";

export default {
  schema: "packages/core/src/database/schema.ts",
  driver: "pg",
  out: "migrations",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
