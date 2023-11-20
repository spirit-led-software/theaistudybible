import { databaseConfig, envConfig } from "@core/configs";
import * as schema from "@core/database/schema";
import {
  Client,
  neon,
  neonConfig,
  type NeonQueryFunction,
} from "@neondatabase/serverless";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import {
  drizzle as drizzleHttp,
  type NeonHttpDatabase,
} from "drizzle-orm/neon-http";
import {
  drizzle as drizzleWs,
  type NeonQueryResultHKT,
} from "drizzle-orm/neon-serverless";
import type { PgTransaction } from "drizzle-orm/pg-core";
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
          `Failed to fetch url=${input}\nrequest=${JSON.stringify(
            init
          )}\nresponseStatus=${response.status}\nresponseStatusText=${
            response.statusText
          }`
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

export async function transaction<T>(
  fn: (
    db: PgTransaction<
      NeonQueryResultHKT,
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >
  ) => Promise<T>
): Promise<T> {
  const client = readWriteDatabaseConfig.getWsClient();
  try {
    await client.connect();
    const drizzle = drizzleWs(client, { schema, logger: envConfig.isLocal });
    return await drizzle.transaction(fn);
  } finally {
    await client.end();
  }
}
