import { dataSources } from '@revelationsai/core/database/schema';
import { syncDataSource } from '@revelationsai/server/lib/data-source';
import { db } from '@revelationsai/server/lib/database';
import type { Handler } from 'aws-lambda';
import { eq, not } from 'drizzle-orm';

export const handler: Handler = async (event) => {
  console.log('Syncing data sources:', event);

  const sources = await db.query.dataSources.findMany({
    where: not(eq(dataSources.syncSchedule, 'NEVER')),
    limit: Number.MAX_SAFE_INTEGER
  });

  await Promise.all(
    sources.map(async (source) => {
      if (!source.syncSchedule || source.syncSchedule === 'NEVER') {
        return;
      } else if (source.syncSchedule === 'DAILY') {
        const lastSync = source.lastAutomaticSync;
        if (lastSync && lastSync > new Date(Date.now() - 1000 * 60 * 60 * 24)) {
          return;
        }
      } else if (source.syncSchedule === 'WEEKLY') {
        const lastSync = source.lastAutomaticSync;
        if (lastSync && lastSync > new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)) {
          return;
        }
      } else if (source.syncSchedule === 'MONTHLY') {
        const lastSync = source.lastAutomaticSync;
        if (lastSync && lastSync > new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)) {
          return;
        }
      }

      console.log('Syncing Source:', source);
      await syncDataSource(source.id, false);
    })
  );
};
