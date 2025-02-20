import { vectorStore } from '@/ai/vector-store';
import { db } from '@/core/database';
import { devotionReactions, devotions } from '@/core/database/schema';
import type { Devotion, DevotionImage, DevotionReaction } from '@/schemas/devotions/types';
import type { Bindings, Variables } from '@/www/server/api/types';
import { PaginationSchema } from '@/www/server/api/utils/pagination';
import { zValidator } from '@hono/zod-validator';
import type { SQL } from 'drizzle-orm';
import { and, count, eq } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { Hono } from 'hono';

export const listDevotionsSchema = PaginationSchema(devotions);

export const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables & {
    devotion: Devotion;
    devotionImage: DevotionImage;
    devotionReaction: DevotionReaction;
  };
}>()
  .use('/:id/*', async (c, next) => {
    const id = c.req.param('id');
    const devotion = await db.query.devotions.findFirst({
      where: (devotions, { eq }) => eq(devotions.id, id),
    });

    if (!devotion) {
      return c.json({ message: 'Devotion not found' }, 404);
    }

    c.set('devotion', devotion);
    await next();
  })
  .use('/:id/image/*', async (c, next) => {
    const image = await db.query.devotionImages.findFirst({
      where: (devotionImages, { eq }) => eq(devotionImages.devotionId, c.var.devotion.id),
    });

    if (!image) {
      return c.json({ message: 'Devotion image not found' }, 404);
    }

    c.set('devotionImage', image);
    await next();
  })
  .use('/:id/reactions/:reactionId/*', async (c, next) => {
    const reactionId = c.req.param('reactionId');
    const reaction = await db.query.devotionReactions.findFirst({
      where: (devotionReactions, { and, eq }) =>
        and(
          eq(devotionReactions.devotionId, c.var.devotion.id),
          eq(devotionReactions.id, reactionId),
        ),
    });

    if (!reaction) {
      return c.json({ message: 'Devotion reaction not found' }, 404);
    }

    if (
      c.req.method !== 'GET' &&
      c.var.user?.id !== reaction.userId &&
      !c.var.roles?.some((role) => role.id === 'admin')
    ) {
      return c.json({ message: 'You do not have permission to access this resource.' }, 403);
    }

    c.set('devotionReaction', reaction);
    await next();
  })
  .get('/', zValidator('query', listDevotionsSchema), async (c) => {
    const { cursor, limit, filter, sort } = c.req.valid('query');

    const [foundDevotions, devotionsCount] = await Promise.all([
      db.query.devotions.findMany({
        where: filter,
        orderBy: sort,
        offset: cursor,
        limit: limit,
      }),
      db
        .select({ count: count() })
        .from(devotions)
        .where(filter)
        .then((count) => count[0].count),
    ]);

    return c.json(
      {
        data: foundDevotions,
        nextCursor: foundDevotions.length < limit ? null : cursor + limit,
        count: devotionsCount,
      },
      200,
    );
  })
  .get('/:id', (c) => {
    return c.json(
      {
        data: c.var.devotion,
      },
      200,
    );
  })
  .post(
    '/:id/reactions',
    zValidator(
      'json',
      createInsertSchema(devotionReactions).pick({
        reaction: true,
        comment: true,
      }),
    ),
    async (c) => {
      const data = c.req.valid('json');

      if (!c.var.user?.id) {
        return c.json({ message: 'You must be logged in' }, 401);
      }

      const [reaction] = await db
        .insert(devotionReactions)
        .values({
          ...data,
          devotionId: c.var.devotion.id,
          userId: c.var.user.id,
        })
        .returning();

      return c.json(
        {
          data: reaction,
        },
        201,
      );
    },
  )
  .get('/:id/reactions', zValidator('query', PaginationSchema(devotionReactions)), async (c) => {
    const { cursor, limit, filter, sort } = c.req.valid('query');

    let where: SQL<unknown> | undefined = eq(devotionReactions.devotionId, c.var.devotion.id);
    if (filter) {
      where = where ? and(where, eq(devotionReactions.reaction, filter)) : filter;
    }

    const [foundReactions, reactionsCount] = await Promise.all([
      db.query.devotionReactions.findMany({
        where,
        orderBy: sort,
        offset: cursor,
        limit: limit,
      }),
      db
        .select({ count: count() })
        .from(devotionReactions)
        .where(where)
        .then((count) => count[0].count),
    ]);

    return c.json(
      {
        data: foundReactions,
        nextCursor: foundReactions.length < limit ? null : cursor + limit,
        count: reactionsCount,
      },
      200,
    );
  })
  .patch(
    '/:id/reactions/:reactionId',
    zValidator('json', createInsertSchema(devotionReactions)),
    async (c) => {
      const data = c.req.valid('json');

      const [reaction] = await db
        .update(devotionReactions)
        .set(data)
        .where(
          and(
            eq(devotionReactions.devotionId, c.var.devotion.id),
            eq(devotionReactions.id, c.var.devotionReaction.id),
          ),
        )
        .returning();

      return c.json(
        {
          data: reaction,
        },
        200,
      );
    },
  )
  .get('/:id/reactions/:reactionId', (c) => {
    return c.json(
      {
        data: c.var.devotionReaction,
      },
      200,
    );
  })
  .get('/:id/source-documents', async (c) => {
    const devotion = c.var.devotion;
    const sourceDocumentRelations = await db.query.devotionsToSourceDocuments.findMany({
      where: (devotionSourceDocuments, { eq }) =>
        eq(devotionSourceDocuments.devotionId, devotion.id),
    });

    const sourceDocuments = await vectorStore.getDocuments(
      sourceDocumentRelations.map((r) => r.sourceDocumentId),
    );

    return c.json(
      {
        data: sourceDocuments.map((d, i) => {
          const relation = sourceDocumentRelations[i];
          return {
            ...d,
            distance: relation.distance,
            distanceMetric: relation.distanceMetric,
          };
        }),
      },
      200,
    );
  });

export default app;
