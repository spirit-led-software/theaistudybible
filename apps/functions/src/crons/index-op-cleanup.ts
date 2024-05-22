import { indexOperations } from '@theaistudybible/core/database/schema';
import { db } from '@theaistudybible/server/lib/database';
import type { Handler } from 'aws-lambda';
import { and, eq, lt } from 'drizzle-orm';

export const handler: Handler = async (event) => {
  console.log('Cleaning up old index ops:', event);

  // Get all index ops that are running and older than 1 day
  const indexOps = await db.query.indexOperations.findMany({
    where: and(
      eq(indexOperations.status, 'RUNNING'),
      lt(
        indexOperations.createdAt,
        new Date(Date.now() - 1000 * 60 * 60 * 24 * 1) // 1 day
      )
    ),
    limit: Number.MAX_SAFE_INTEGER
  });

  // Set them to failed
  await Promise.all(
    indexOps.map(async (indexOp) => {
      await db
        .update(indexOperations)
        .set({
          status: 'FAILED',
          errorMessages: [...(indexOp?.errorMessages ?? []), 'Index operation timed out']
        })
        .where(eq(indexOperations.id, indexOp.id));
    })
  );
};
