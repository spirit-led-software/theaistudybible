import envConfig from '@core/configs/env';
import * as schema from '@core/schema';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { NeonQueryResultHKT } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleWs } from 'drizzle-orm/neon-serverless';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import { readWriteDatabaseConfig } from './database';

export async function transaction<T>(
  fn: (
    db: PgTransaction<NeonQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>
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
