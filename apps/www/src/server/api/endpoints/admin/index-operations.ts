import { db } from '@/core/database';
import { indexOperations } from '@/core/database/schema';
import type { IndexOperation } from '@/schemas/data-sources/types';
import type { Bindings, Variables } from '@/www/server/api/types';
import { PaginationSchema } from '@/www/server/api/utils/pagination';
import { zValidator } from '@hono/zod-validator';
import { count, eq } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { Hono } from 'hono';
import { z } from 'zod';

export const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables & {
    indexOperation: IndexOperation;
  };
}>()
  .use('/:id/*', async (c, next) => {
    const id = c.req.param('id');
    const indexOperation = await db.query.indexOperations.findFirst({
      where: eq(indexOperations.id, id),
    });

    if (!indexOperation) {
      return c.json({ message: 'Index operation not found' }, 404);
    }

    c.set('indexOperation', indexOperation);
    await next();
  })
  .get('/', zValidator('query', PaginationSchema(indexOperations)), async (c) => {
    const { cursor, limit, filter, sort } = c.req.valid('query');

    const [foundIndexOperations, indexOperationsCount] = await Promise.all([
      db.query.indexOperations.findMany({
        where: filter,
        orderBy: sort,
        offset: cursor,
        limit: limit,
      }),
      db.select({ count: count() }).from(indexOperations).where(filter),
    ]);

    return c.json(
      {
        data: foundIndexOperations,
        nextCursor: foundIndexOperations.length < limit ? null : cursor + limit,
        count: indexOperationsCount[0].count,
      },
      200,
    );
  })
  .get('/:id', (c) => {
    return c.json(
      {
        data: c.var.indexOperation,
      },
      200,
    );
  })
  .patch(
    '/:id',
    zValidator(
      'json',
      createInsertSchema(indexOperations, {
        metadata: z.record(z.string(), z.any()),
        errorMessages: z.array(z.string()),
      }),
    ),
    async (c) => {
      const data = c.req.valid('json');

      const [indexOperation] = await db
        .update(indexOperations)
        .set(data)
        .where(eq(indexOperations.id, c.req.param('id')))
        .returning();

      return c.json(
        {
          data: indexOperation,
        },
        200,
      );
    },
  )
  .delete('/:id', async (c) => {
    await db.delete(indexOperations).where(eq(indexOperations.id, c.req.param('id')));
    return c.json(
      {
        message: 'Index operation deleted',
      },
      200,
    );
  });

export default app;
