import { databaseConfig, envConfig } from "@core/configs";
import * as schema from "@core/database/schema";
import {
  Client,
  neon,
  neonConfig,
  type NeonQueryFunction,
} from "@neondatabase/serverless";
import {
  drizzle as drizzleHttp,
  type NeonHttpDatabase,
} from "drizzle-orm/neon-http";
import {
  drizzle as drizzleWs,
  type NeonDatabase,
} from "drizzle-orm/neon-serverless";
import ws from "ws";

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
        throw new Error(
          `Failed to fetch ${input} with status ${response.status} ${response.statusText}`
        );
      }

      return response;
    } catch (error: any) {
      if (tryCount < retries) {
        console.log(
          `[Neon Fetch] Retrying neon fetch after ${tryCount} attempt(s) with error: ${error.message}\n${error.stack}`
        );
        console.log(
          `[Neon Fetch] Waiting ${tryCount * 1000} seconds before retrying`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000 * tryCount));
        tryCount++;
        continue;
      }
      console.log(
        `[Neon Fetch] Failed after ${tryCount} attempts with error: ${error.message}\n${error.stack}`
      );
      throw error;
    }
  }
  throw new Error("Failed to fetch");
}

export class RAIDatabaseConfig {
  queryFn: NeonQueryFunction<false, false>;
  database: NeonHttpDatabase<typeof schema>;

  private readonly connectionString: string;

  constructor({ connectionString, readOnly }: RAIDatabaseConfigInput) {
    this.connectionString = connectionString;

    neonConfig.fetchFunction = neonFetchFn;
    this.queryFn = neon(connectionString, {
      readOnly,
    });
    this.database = drizzleHttp(this.queryFn, {
      schema,
      logger: envConfig.isLocal,
    });
  }

  getWsClient() {
    neonConfig.webSocketConstructor = ws;
    return new Client(this.connectionString);
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

export async function readWriteDbTxn<T>(
  fn: (db: NeonDatabase<typeof schema>) => Promise<T>
): Promise<T> {
  const client = readWriteDatabaseConfig.getWsClient();
  try {
    await client.connect();
    await client.query("BEGIN");

    const drizzle = drizzleWs(client, { schema, logger: envConfig.isLocal });
    const result = await fn(drizzle);

    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

export async function readOnlyDbTxn<T>(
  fn: (db: NeonDatabase<typeof schema>) => Promise<T>
): Promise<T> {
  const client = readOnlyDatabaseConfig.getWsClient();
  try {
    await client.connect();
    await client.query("BEGIN");

    const drizzle = drizzleWs(client, { schema, logger: envConfig.isLocal });
    const result = await fn(drizzle);

    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}
