import envConfig from '@core/configs/env';
import * as schema from '@core/schema';
import { Client as NeonClient, neon, neonConfig } from '@neondatabase/serverless';
import { Client as PolyScaleClient } from '@polyscale/serverless-js';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import type { PgRemoteDatabase } from 'drizzle-orm/pg-proxy';
import { drizzle as drizzleProxy } from 'drizzle-orm/pg-proxy';
import { as as pgp } from 'pg-promise';
import ws from 'ws';

export type RAIDatabaseConfigInput = {
  connectionString: string;
  readOnly?: boolean;
  polyScaleAppId?: string;
};

export async function neonFetchFn(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const retries = 5;

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
  database: NeonHttpDatabase<typeof schema> | PgRemoteDatabase<typeof schema>;

  readonly connectionString: string;

  constructor({ connectionString, readOnly, polyScaleAppId }: RAIDatabaseConfigInput) {
    if (polyScaleAppId) {
      this.connectionString = connectionString;
      const { username, password, pathname } = new URL(connectionString);
      this.database = drizzleProxy(
        async (sqlString, params, method) => {
          try {
            const polyScale = new PolyScaleClient('https://serverless.aws.psedge.global', {
              cacheId: polyScaleAppId,
              username,
              password,
              database: pathname.slice(1),
              provider: 'postgres'
            });
            const query = pgp.format(sqlString, params);
            const result = await polyScale.query(query);
            return {
              rows:
                method === 'all'
                  ? result.map((row) => Object.entries(row as object).map((entry) => entry[1]))
                  : result
            };
          } catch (error) {
            if (error instanceof Error) {
              console.error(`PolyScale query failed with error: ${error.message}\n${error.stack}`);
            } else {
              console.error(`PolyScale query failed with error: ${JSON.stringify(error)}`);
            }
            throw error;
          }
        },
        {
          schema,
          logger: envConfig.isLocal
        }
      );
    } else {
      this.connectionString = connectionString;
      neonConfig.fetchFunction = neonFetchFn;
      const queryFn = neon(connectionString, {
        readOnly
      });
      this.database = drizzleHttp(queryFn, {
        schema,
        logger: envConfig.isLocal
      });
    }
  }

  getWsClient() {
    neonConfig.webSocketConstructor = ws;
    return new NeonClient(this.connectionString);
  }
}
