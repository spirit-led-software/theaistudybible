import { vectorStore } from '@/ai/vector-store';
import { db } from '@/core/database';
import { dataSources, dataSourcesToSourceDocuments, indexOperations } from '@/core/database/schema';
import type { DataSource } from '@/schemas/data-sources/types';
import type { Bindings, Variables } from '@/www/server/api/types';
import { PaginationSchema } from '@/www/server/api/utils/pagination';
import { zValidator } from '@hono/zod-validator';
import type { SQL } from 'drizzle-orm';
import { and, count, eq } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { Hono } from 'hono';
import { z } from 'zod';

export const listDataSourcesSchema = PaginationSchema(dataSources);

export const upsertDataSourceSchema = createInsertSchema(dataSources, {
  metadata: z.record(z.string(), z.any()),
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
      where: eq(dataSources.id, id),
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
        data: dataSource,
      },
      201,
    );
  })
  .get('/', zValidator('query', listDataSourcesSchema), async (c) => {
    const { cursor, limit, filter, sort } = c.req.valid('query');

    const [foundDataSources, dataSourcesCount] = await Promise.all([
      db.query.dataSources.findMany({
        where: filter,
        orderBy: sort,
        offset: cursor,
        limit: limit,
      }),
      db
        .select({ count: count() })
        .from(dataSources)
        .where(filter)
        .then((count) => count[0].count),
    ]);

    return c.json(
      {
        data: foundDataSources,
        nextCursor: foundDataSources.length < limit ? null : cursor + limit,
        count: dataSourcesCount,
      },
      200,
    );
  })
  .get('/:id', (c) => {
    return c.json(
      {
        data: c.var.dataSource,
      },
      200,
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
        data: dataSource,
      },
      200,
    );
  })
  // .post('/:id/sync', async (c) => {
  //   const dataSource = await syncDataSource(c.var.dataSource.id, true);
  //   return c.json(
  //     {
  //       message: 'Sync complete',
  //       data: dataSource
  //     },
  //     200
  //   );
  // })
  .get(
    '/:id/source-documents',
    zValidator(
      'query',
      z
        .object({
          cursor: z
            .string()
            .optional()
            .transform((v) => (v ? Number.parseInt(v) : 0)),
          limit: z
            .string()
            .optional()
            .transform((v) => (v ? Number.parseInt(v) : 10)),
        })
        .optional()
        .transform(
          (v) =>
            v || {
              cursor: 0,
              limit: 10,
            },
        ),
    ),
    async (c) => {
      const { cursor, limit } = c.req.valid('query');

      const [sourceDocumentIds, sourceDocumentCount] = await Promise.all([
        db.query.dataSourcesToSourceDocuments
          .findMany({
            where: eq(dataSourcesToSourceDocuments.dataSourceId, c.var.dataSource.id),
            limit,
            offset: cursor,
          })
          .then((res) => res.map((r) => r.sourceDocumentId)),
        db
          .select({ count: count() })
          .from(dataSourcesToSourceDocuments)
          .where(eq(dataSourcesToSourceDocuments.dataSourceId, c.var.dataSource.id))
          .then((res) => res[0].count),
      ]);

      const sourceDocuments = await vectorStore.getDocuments(sourceDocumentIds, {
        withMetadata: true,
      });

      return c.json(
        {
          data: sourceDocuments,
          nextCursor: sourceDocumentIds.length < limit ? null : cursor + limit,
          count: sourceDocumentCount,
        },
        200,
      );
    },
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
          limit,
        }),
        db
          .select({ count: count() })
          .from(indexOperations)
          .where(where)
          .then((res) => res[0].count),
      ]);

      return c.json(
        {
          data: foundIndexOperations,
          nextCursor: foundIndexOperations.length < limit ? null : cursor + limit,
          count: indexOperationsCount,
        },
        200,
      );
    },
  );

export default app;
