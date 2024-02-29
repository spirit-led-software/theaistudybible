import { Client as NeonClient, neon, neonConfig } from '@neondatabase/serverless';
import envConfig from '@revelationsai/core/configs/env';
import * as schema from '@revelationsai/core/database/schema';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import ws from 'ws';

export type RAIDatabaseConfigInput = {
  connectionString: string;
  readOnly?: boolean;
};

export async function neonFetchFn(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const retries = 3;

  let tryCount = 1;
  while (tryCount <= retries) {
    try {
      const response = await fetch(input, init);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch url=${input}\nresponseStatus=${response.status}\nresponseStatusText=${
            response.statusText
          }\nresponseBody=${await response.text()}`
        );
      }
      return response;
    } catch (error) {
      if (tryCount < retries) {
        console.log(
          `[Neon Fetch] Retrying neon fetch after ${tryCount} attempt(s) with error:`,
          error instanceof Error
            ? `${error.message}\n${error.stack}`
            : `Error: ${JSON.stringify(error)}`
        );
        console.log(`[Neon Fetch] Waiting ${tryCount * 1000} milliseconds before retrying`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * tryCount));
        tryCount++;
        continue;
      }
      console.log(
        `[Neon Fetch] Failed after ${tryCount} attempts with error:`,
        error instanceof Error
          ? `${error.message}\n${error.stack}`
          : `Error: ${JSON.stringify(error)}`
      );
      throw error;
    }
  }
  throw new Error('Failed to fetch');
}

export class RAIDatabaseConfig {
  database: NeonHttpDatabase<typeof schema>;

  readonly connectionString: string;

  constructor({ connectionString, readOnly }: RAIDatabaseConfigInput) {
    this.connectionString = connectionString;
    neonConfig.fetchFunction = neonFetchFn;
    const queryFn = neon(connectionString, {
      readOnly
    });
    // @ts-expect-error - Error with NeonHttpDatabase right now for some reason
    this.database = drizzleHttp(queryFn, {
      schema,
      logger: envConfig.isLocal
    });
  }

  getWsClient() {
    neonConfig.webSocketConstructor = ws;
    return new NeonClient(this.connectionString);
  }
}
