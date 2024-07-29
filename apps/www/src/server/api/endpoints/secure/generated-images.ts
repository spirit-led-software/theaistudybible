import { zValidator } from '@hono/zod-validator';
import { vectorStore } from '@theaistudybible/ai/vector-store';
import { db } from '@theaistudybible/core/database';
import { userGeneratedImages } from '@theaistudybible/core/database/schema';
import type { UserGeneratedImage } from '@theaistudybible/core/model/generated-image';
import { hasRole } from '@theaistudybible/core/user';
import { SQL, and, count, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { Bindings, Variables } from '~/server/api/types';
import { PaginationSchema } from '~/server/api/utils/pagination';

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
    const image = await db.query.userGeneratedImages.findFirst({
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
      !hasRole('admin', c.var.clerkAuth!.sessionClaims!)
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
  // .post(
  //   '/',
  //   zValidator(
  //     'json',
  //     z.object({
  //       prompt: z.string().min(1).max(255)
  //     })
  //   ),
  //   async (c) => {
  //     const { prompt } = c.req.valid('json');
  //     const image = await generateImage(c.var.clerkAuth!.userId!, prompt);

  //     return c.json(
  //       {
  //         data: image
  //       },
  //       200
  //     );
  //   }
  // )
  .get('/', zValidator('query', PaginationSchema(userGeneratedImages)), async (c) => {
    const { cursor, limit, filter, sort } = c.req.valid('query');

    let where: SQL<unknown> | undefined = eq(userGeneratedImages.userId, c.var.clerkAuth!.userId!);
    if (filter) {
      where = and(where, filter);
    }

    const [foundImages, imageCount] = await Promise.all([
      db.query.userGeneratedImages.findMany({
        where,
        limit,
        offset: cursor,
        orderBy: sort
      }),
      db
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
  .delete('/:id', async (c) => {
    await db.delete(userGeneratedImages).where(eq(userGeneratedImages.id, c.var.image.id));
    return c.json(
      {
        message: 'Image deleted successfully'
      },
      200
    );
  })
  .get('/:id/source-documents', async (c) => {
    const sourceDocumentRelations = await db.query.userGeneratedImagesToSourceDocuments.findMany({
      where: eq(userGeneratedImages.id, c.var.image.id)
    });
    const sourceDocuments = await vectorStore.getDocuments(
      sourceDocumentRelations.map((r) => r.sourceDocumentId)
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
