import { zValidator } from '@hono/zod-validator';
import { db } from '@lib/server/database';
import { PaginationSchema } from '@theaistudybible/api/lib/utils/pagination';
import type { Bindings, Variables } from '@theaistudybible/api/types';
import {
    dataSources,
    dataSourcesToSourceDocuments,
    indexOperations
} from '@theaistudybible/core/database/schema';
import type { DataSource } from '@theaistudybible/core/model/data-source';
import { getDocumentVectorStore } from '@theaistudybible/langchain/lib/vector-db';
import { syncDataSource } from '@theaistudybible/server/lib/data-source';
import { SQL, and, count, eq } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { Hono } from 'hono';
import { z } from 'zod';

export const listDataSourcesSchema = PaginationSchema(dataSources);

export const upsertDataSourceSchema = createInsertSchema(dataSources, {
  metadata: z.record(z.string(), z.any())
});

export const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables & {
    dataSource: DataSource;
  };
}>()
  .use('/:id/*', async (c, next) => {
    const id = c.req.param('id');
    const dataSource = await db.query.dataSources.findFirst({
      where: eq(dataSources.id, id)
    });
    if (!dataSource) {
      return c.json({ message: 'Data source not found' }, 404);
    }
    c.set('dataSource', dataSource);
    await next();
  })
  .post('/', zValidator('json', upsertDataSourceSchema), async (c) => {
    const data = c.req.valid('json');

    const [dataSource] = await db.insert(dataSources).values(data).returning();

    return c.json(
      {
        data: dataSource
      },
      201
    );
  })
  .get('/', zValidator('query', listDataSourcesSchema), async (c) => {
    const { cursor, limit, filter, sort } = c.req.valid('query');

    const [foundDataSources, dataSourcesCount] = await Promise.all([
      db.query.dataSources.findMany({
        where: filter,
        orderBy: sort,
        offset: cursor,
        limit: limit
      }),
      db
        .select({ count: count() })
        .from(dataSources)
        .where(filter)
        .then((count) => count[0].count)
    ]);

    return c.json(
      {
        data: foundDataSources,
        nextCursor: foundDataSources.length < limit ? undefined : cursor + limit,
        count: dataSourcesCount
      },
      200
    );
  })
  .get('/:id', async (c) => {
    return c.json(
      {
        data: c.var.dataSource
      },
      200
    );
  })
  .patch('/:id', zValidator('json', upsertDataSourceSchema), async (c) => {
    const data = c.req.valid('json');
    const [dataSource] = await db
      .update(dataSources)
      .set(data)
      .where(eq(dataSources.id, c.var.dataSource.id))
      .returning();
    return c.json(
      {
        data: dataSource
      },
      200
    );
  })
  .post('/:id/sync', async (c) => {
    const dataSource = await syncDataSource(c.var.dataSource.id, true);
    return c.json(
      {
        message: 'Sync complete',
        data: dataSource
      },
      200
    );
  })
  .get(
    '/:id/source-documents',
    zValidator(
      'query',
      z
        .object({
          cursor: z
            .string()
            .optional()
            .transform((v) => (v ? parseInt(v) : 0)),
          limit: z
            .string()
            .optional()
            .transform((v) => (v ? parseInt(v) : 10))
        })
        .optional()
        .transform(
          (v) =>
            v || {
              cursor: 0,
              limit: 10
            }
        )
    ),
    async (c) => {
      const { cursor, limit } = c.req.valid('query');

      const [sourceDocumentIds, sourceDocumentCount] = await Promise.all([
        db.query.dataSourcesToSourceDocuments
          .findMany({
            where: eq(dataSourcesToSourceDocuments.dataSourceId, c.var.dataSource.id),
            limit,
            offset: cursor
          })
          .then((res) => res.map((r) => r.sourceDocumentId)),
        db
          .select({ count: count() })
          .from(dataSourcesToSourceDocuments)
          .where(eq(dataSourcesToSourceDocuments.dataSourceId, c.var.dataSource.id))
          .then((res) => res[0].count)
      ]);

      const vectorStore = await getDocumentVectorStore();
      const sourceDocuments = await vectorStore.index.fetch(sourceDocumentIds, {
        includeMetadata: true
      });

      return c.json(
        {
          data: sourceDocuments,
          nextCursor: sourceDocumentIds.length < limit ? undefined : cursor + limit,
          count: sourceDocumentCount
        },
        200
      );
    }
  )
  .get(
    '/:id/index-operations',
    zValidator('query', PaginationSchema(indexOperations)),
    async (c) => {
      const { cursor, limit, filter, sort } = c.req.valid('query');

      let where: SQL<unknown> | undefined = eq(indexOperations.dataSourceId, c.var.dataSource.id);
      if (filter) {
        where = and(where, filter);
      }

      const [foundIndexOperations, indexOperationsCount] = await Promise.all([
        db.query.indexOperations.findMany({
          where,
          orderBy: sort,
          offset: cursor,
          limit
        }),
        db
          .select({ count: count() })
          .from(indexOperations)
          .where(where)
          .then((res) => res[0].count)
      ]);

      return c.json(
        {
          data: foundIndexOperations,
          nextCursor: foundIndexOperations.length < limit ? undefined : cursor + limit,
          count: indexOperationsCount
        },
        200
      );
    }
  );

export default app;
