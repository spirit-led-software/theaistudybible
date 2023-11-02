import { databaseConfig, envConfig } from "@core/configs";
import * as schema from "@core/database/schema";
import {
  neon,
  neonConfig,
  type NeonQueryFunction,
} from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

export type RAIDatabaseConfigInput = {
  connectionString: string;
  readOnly?: boolean;
};

export async function neonFetchFn(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const retries = 5;

  let tryCount = 1;
  while (tryCount <= retries) {
    try {
      const response = await fetch(input, init);
      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      return response;
    } catch (error) {
      if (tryCount < retries) {
        console.log(
          `[Neon Fetch] Retrying neon fetch after ${tryCount} attempt(s) with error: ${error}`
        );
        console.log(
          `[Neon Fetch] Waiting ${tryCount * 1000} seconds before retrying`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000 * tryCount));
        tryCount++;
        continue;
      }
      console.log(
        `[Neon Fetch] Failed after ${tryCount} attempts with error: ${error}`
      );
      throw error;
    }
  }
  throw new Error("Failed to fetch");
}

export class RAIDatabaseConfig {
  queryFn: NeonQueryFunction<false, false>;
  database: NeonHttpDatabase<typeof schema>;

  constructor({ connectionString, readOnly }: RAIDatabaseConfigInput) {
    neonConfig.fetchFunction = neonFetchFn;
    this.queryFn = neon(connectionString, {
      readOnly,
    });
    this.database = drizzle(this.queryFn, {
      schema,
      logger: envConfig.isLocal,
    });
  }
}

export const readOnlyDatabaseConfig = new RAIDatabaseConfig({
  connectionString: databaseConfig.readOnlyUrl,
  readOnly: true,
});
export const readOnlyDatabase = readOnlyDatabaseConfig.database;

export const readWriteDatabaseConfig = new RAIDatabaseConfig({
  connectionString: databaseConfig.readWriteUrl,
  readOnly: false,
});
export const readWriteDatabase = readWriteDatabaseConfig.database;

export default {
  readOnlyDatabase,
  readWriteDatabase,
};
