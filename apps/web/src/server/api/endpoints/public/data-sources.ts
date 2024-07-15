import { zValidator } from '@hono/zod-validator';
import { vectorStore } from '@theaistudybible/ai/vector-store';
import { db } from '@theaistudybible/core/database';
import { dataSources, dataSourcesToSourceDocuments } from '@theaistudybible/core/database/schema';
import type { DataSource } from '@theaistudybible/core/model/data-source';
import { count, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '~/server/api/types';
import { PaginationSchema } from '~/server/api/utils/pagination';

export const listDataSourcesSchema = PaginationSchema(dataSources);

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

      const sourceDocuments = await vectorStore.getDocuments(sourceDocumentIds);

      return c.json(
        {
          data: sourceDocuments,
          nextCursor: sourceDocumentIds.length < limit ? undefined : cursor + limit,
          count: sourceDocumentCount
        },
        200
      );
    }
  );

export default app;
