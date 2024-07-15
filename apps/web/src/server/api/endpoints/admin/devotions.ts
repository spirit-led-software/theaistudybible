import { zValidator } from '@hono/zod-validator';
import { vectorStore } from '@theaistudybible/ai/vector-store';
import { db } from '@theaistudybible/core/database';
import { devotionReactions, devotions } from '@theaistudybible/core/database/schema';
import type { Devotion } from '@theaistudybible/core/model/devotion';
import type { DevotionImage } from '@theaistudybible/core/model/devotion/image';
import type { DevotionReaction } from '@theaistudybible/core/model/devotion/reaction';
import { SQL, and, count, eq } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '~/server/api/types';
import { PaginationSchema } from '~/server/api/utils/pagination';

export const listDevotionsSchema = PaginationSchema(devotions);

export const createDevotionSchema = z
  .object({
    topic: z.string().min(1).max(255).optional(),
    bibleReading: z.string().min(1).max(255).optional()
  })
  .optional()
  .transform((val) => val || {});

export const updateDevotionSchema = createInsertSchema(devotions, {
  diveDeeperQueries: z.array(z.string()).optional()
});

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
      where: (devotions, { eq }) => eq(devotions.id, id)
    });

    if (!devotion) {
      return c.json({ message: 'Devotion not found' }, 404);
    }

    c.set('devotion', devotion);
    await next();
  })
  .use('/:id/image/*', async (c, next) => {
    const image = await db.query.devotionImages.findFirst({
      where: (devotionImages, { eq }) => eq(devotionImages.devotionId, c.var.devotion.id)
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
          eq(devotionReactions.id, reactionId)
        )
    });

    if (!reaction) {
      return c.json({ message: 'Devotion reaction not found' }, 404);
    }

    c.set('devotionReaction', reaction);
    await next();
  })
  // .post('/', zValidator('json', createDevotionSchema), async (c) => {
  //   const { topic, bibleReading } = c.req.valid('json');

  //   const devotion = await generateDevotion(topic, bibleReading);

  //   return c.json(
  //     {
  //       data: devotion
  //     },
  //     201
  //   );
  // })
  .get('/', zValidator('query', listDevotionsSchema), async (c) => {
    const { cursor, limit, filter, sort } = c.req.valid('query');

    const [foundDevotions, devotionsCount] = await Promise.all([
      db.query.devotions.findMany({
        where: filter,
        orderBy: sort,
        offset: cursor,
        limit: limit
      }),
      db
        .select({ count: count() })
        .from(devotions)
        .where(filter)
        .then((count) => count[0].count)
    ]);

    return c.json(
      {
        data: foundDevotions,
        nextCursor: foundDevotions.length < limit ? undefined : cursor + limit,
        count: devotionsCount
      },
      200
    );
  })
  .get('/:id', async (c) => {
    return c.json(
      {
        data: c.var.devotion
      },
      200
    );
  })
  .patch('/:id', zValidator('json', updateDevotionSchema), async (c) => {
    const data = c.req.valid('json');

    const [devotion] = await db
      .update(devotions)
      .set(data)
      .where(eq(devotions.id, c.var.devotion.id))
      .returning();

    return c.json(
      {
        data: devotion
      },
      200
    );
  })
  .delete('/:id', async (c) => {
    await db.delete(devotions).where(eq(devotions.id, c.var.devotion.id));
    return c.json(
      {
        message: 'Devotion deleted'
      },
      204
    );
  })
  .get('/:id/image', async (c) => {
    return c.json({ data: c.var.devotionImage }, 200);
  })
  .get('/:id/reactions', zValidator('query', PaginationSchema(devotionReactions)), async (c) => {
    const { cursor, limit, filter, sort } = c.req.valid('query');

    let where: SQL<unknown> | undefined = eq(devotionReactions.devotionId, c.var.devotion.id);
    if (filter) {
      where = and(where, eq(devotionReactions.reaction, filter));
    }

    const [foundReactions, reactionsCount] = await Promise.all([
      db.query.devotionReactions.findMany({
        where,
        orderBy: sort,
        offset: cursor,
        limit: limit
      }),
      db
        .select({ count: count() })
        .from(devotionReactions)
        .where(where)
        .then((count) => count[0].count)
    ]);

    return c.json(
      {
        data: foundReactions,
        nextCursor: foundReactions.length < limit ? undefined : cursor + limit,
        count: reactionsCount
      },
      200
    );
  })
  .get('/:id/reactions/:reactionId', async (c) => {
    return c.json({ data: c.var.devotionReaction }, 200);
  })
  .get('/:id/source-documents', async (c) => {
    const devotion = c.var.devotion;
    const sourceDocumentRelations = await db.query.devotionsToSourceDocuments.findMany({
      where: (devotionSourceDocuments, { eq }) =>
        eq(devotionSourceDocuments.devotionId, devotion.id)
    });

    const sourceDocuments = await vectorStore.getDocuments(
      sourceDocumentRelations.map((r) => r.sourceDocumentId),
      {
        withMetadata: true
      }
    );

    return c.json(
      {
        data: sourceDocuments.map((d, i) => {
          const relation = sourceDocumentRelations[i];
          return {
            ...d,
            distance: relation.distance,
            distanceMetric: relation.distanceMetric
          };
        })
      },
      200
    );
  });

export default app;
