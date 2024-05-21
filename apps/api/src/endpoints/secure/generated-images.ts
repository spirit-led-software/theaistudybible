import { generatedImage } from '@api/lib/generated-image';
import { checkRole } from '@api/lib/user';
import { PaginationSchema } from '@api/lib/utils/pagination';
import type { Bindings, Variables } from '@api/types';
import { userGeneratedImages } from '@core/database/schema';
import type { UserGeneratedImage } from '@core/model/generated-image';
import { zValidator } from '@hono/zod-validator';
import { getDocumentVectorStore } from '@langchain/lib/vector-db';
import { SQL, and, count, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

export const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables & {
    image: UserGeneratedImage;
  };
}>()
  .use('/*', async (c, next) => {
    if (!c.var.clerkAuth?.userId) {
      return c.json(
        {
          message: 'You must be logged in to access this resource.'
        },
        401
      );
    }
    await next();
  })
  .use('/:id/*', async (c, next) => {
    const image = await c.var.db.query.userGeneratedImages.findFirst({
      where: eq(userGeneratedImages.id, c.req.param('id'))
    });
    if (!image) {
      return c.json(
        {
          message: 'Image not found'
        },
        404
      );
    }

    if (
      c.var.clerkAuth?.userId !== image.userId &&
      !checkRole('admin', c.var.clerkAuth?.sessionClaims)
    ) {
      return c.json(
        {
          message: 'You do not have permission to access this resource.'
        },
        403
      );
    }

    c.set('image', image);
    await next();
  })
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        prompt: z.string().min(1).max(255)
      })
    ),
    async (c) => {
      const { prompt } = c.req.valid('json');
      const image = await generatedImage({
        env: c.env,
        vars: c.var,
        userId: c.var.clerkAuth!.userId!,
        userPrompt: prompt
      });

      return c.json(
        {
          data: image
        },
        200
      );
    }
  )
  .get('/', zValidator('query', PaginationSchema(userGeneratedImages)), async (c) => {
    const { cursor, limit, filter, sort } = c.req.valid('query');

    let where: SQL<unknown> | undefined = eq(userGeneratedImages.userId, c.var.clerkAuth!.userId!);
    if (filter) {
      where = and(where, filter);
    }

    const [foundImages, imageCount] = await Promise.all([
      c.var.db.query.userGeneratedImages.findMany({
        where,
        limit,
        offset: cursor,
        orderBy: sort
      }),
      c.var.db
        .select({
          count: count()
        })
        .from(userGeneratedImages)
        .where(where)
        .then((images) => images[0].count)
    ]);

    return c.json({
      data: foundImages,
      nextCursor: foundImages.length < limit ? undefined : cursor + limit,
      count: imageCount
    });
  })
  .get('/:id', async (c) => {
    return c.json(
      {
        data: c.var.image
      },
      200
    );
  })
  .get('/:id/image', async (c) => {
    const r2Obj = await c.env.BUCKET.get(`generated-images/${c.var.image.id}.png`);
    if (!r2Obj) {
      return c.json(
        {
          message: 'Image not found'
        },
        404
      );
    }
    c.header('Content-Type', 'image/png');
    c.header('Content-Length', r2Obj.size.toString());
    return c.body(r2Obj.body);
  })
  .delete('/:id', async (c) => {
    await c.var.db.delete(userGeneratedImages).where(eq(userGeneratedImages.id, c.var.image.id));
    return c.json(
      {
        message: 'Image deleted successfully'
      },
      200
    );
  })
  .get('/:id/source-documents', async (c) => {
    const sourceDocumentRelations =
      await c.var.db.query.userGeneratedImagesToSourceDocuments.findMany({
        where: eq(userGeneratedImages.id, c.var.image.id)
      });
    const vectorStore = await getDocumentVectorStore({
      env: c.env
    });
    const sourceDocuments = await vectorStore.index.fetch(
      sourceDocumentRelations.map((r) => r.sourceDocumentId),
      {
        includeMetadata: true
      }
    );
    return c.json(
      {
        data: sourceDocuments.map((doc, index) => {
          return {
            ...doc,
            distance: sourceDocumentRelations[index].distance,
            distanceMetric: sourceDocumentRelations[index].distanceMetric
          };
        })
      },
      200
    );
  });

export default app;
