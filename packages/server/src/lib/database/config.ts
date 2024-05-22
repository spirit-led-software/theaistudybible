import { Client as NeonClient, neon, neonConfig } from '@neondatabase/serverless';
import * as schema from '@revelationsai/core/database/schema';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import ws from 'ws';

export type RAIDatabaseConfigInput = {
  connectionString: string;
  readOnly?: boolean;
};

export class RAIDatabaseConfig {
  database: NeonHttpDatabase<typeof schema>;

  readonly connectionString: string;

  constructor({ connectionString, readOnly }: RAIDatabaseConfigInput) {
    this.connectionString = connectionString;
    const queryFn = neon(connectionString, {
      readOnly
    });
    this.database = drizzleHttp(queryFn, {
      schema,
      logger: process.env.IS_LOCAL === 'true'
    });
  }

  getWsClient() {
    neonConfig.webSocketConstructor = ws;
    return new NeonClient(this.connectionString);
  }
}
