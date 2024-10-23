import { db } from '@/core/database';
import { bibles } from '@/core/database/schema';
import type { Bible } from '@/schemas/bibles/types';
import type { Bindings, Variables } from '@/www/server/api/types';
import { PaginationSchema } from '@/www/server/api/utils/pagination';
import { zValidator } from '@hono/zod-validator';
import { count, eq } from 'drizzle-orm';
import { Hono } from 'hono';

export const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables & {
    bible: Bible;
  };
}>()
  .use('/:id/*', async (c, next) => {
    const id = c.req.param('id');
    const bible = await db.query.bibles.findFirst({
      where: eq(bibles.id, id),
    });
    if (!bible) {
      return c.json({ message: 'Bible not found' }, 404);
    }
    c.set('bible', bible);
    await next();
  })
  .get('/', zValidator('query', PaginationSchema(bibles)), async (c) => {
    const { limit, cursor, filter, sort } = c.req.valid('query');

    const [foundBibles, bibleCount] = await Promise.all([
      db.query.bibles.findMany({
        limit,
        offset: cursor,
        where: filter,
        orderBy: sort,
      }),
      db
        .select({
          count: count(),
        })
        .from(bibles)
        .where(filter),
    ]);

    return c.json(
      {
        data: foundBibles,
        nextCursor: foundBibles.length < limit ? null : cursor + limit,
        count: bibleCount,
      },
      200,
    );
  })
  .get('/:id', (c) => {
    return c.json(
      {
        data: c.get('bible'),
      },
      200,
    );
  })
  .delete('/:id', async (c) => {
    const bible = c.get('bible');
    await db.delete(bibles).where(eq(bibles.id, bible.id));
    return c.json({ message: 'Bible deleted' }, 200);
  });

export default app;
