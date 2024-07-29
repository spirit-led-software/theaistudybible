import { zValidator } from '@hono/zod-validator';
import { vectorStore } from '@theaistudybible/ai/vector-store';
import { db } from '@theaistudybible/core/database';
import { messageReactions, messages } from '@theaistudybible/core/database/schema';
import type { Message, MessageReaction } from '@theaistudybible/core/model/chat/message';
import { hasRole } from '@theaistudybible/core/user';
import { SQL, and, count, eq } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { Hono } from 'hono';
import type { Bindings, Variables } from '~/server/api/types';
import { PaginationSchema } from '~/server/api/utils/pagination';

export const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables & {
    message: Message;
    messageReaction: MessageReaction;
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
    const id = c.req.param('id');
    const message = await db.query.messages.findFirst({
      where: eq(messages.id, id)
    });
    if (!message) {
      return c.json(
        {
          message: 'Message not found'
        },
        404
      );
    }

    if (
      c.var.clerkAuth?.userId !== message.userId &&
      !hasRole('admin', c.var.clerkAuth!.sessionClaims!)
    ) {
      return c.json(
        {
          message: 'You do not have permission to access this resource.'
        },
        403
      );
    }

    c.set('message', message);
    await next();
  })
  .use('/:id/reaction/*', async (c, next) => {
    const reaction = await db.query.messageReactions.findFirst({
      where: eq(messageReactions.messageId, c.var.message!.id)
    });
    if (!reaction) {
      return c.json(
        {
          message: 'Message reaction not found'
        },
        404
      );
    }

    if (
      c.var.clerkAuth?.userId !== reaction.userId &&
      !hasRole('admin', c.var.clerkAuth!.sessionClaims!)
    ) {
      return c.json(
        {
          message: 'You do not have permission to access this resource.'
        },
        403
      );
    }

    c.set('messageReaction', reaction);
    await next();
  })
  .post(
    '/',
    zValidator(
      'json',
      createInsertSchema(messages).omit({
        userId: true
      })
    ),
    async (c) => {
      const data = c.req.valid('json');
      const message = await db
        .insert(messages)
        // @ts-expect-error - We know this is the correct type
        .values({
          ...data,
          userId: c.var.clerkAuth!.userId!
        })
        .returning();
      return c.json(
        {
          data: message
        },
        201
      );
    }
  )
  .get('/', zValidator('query', PaginationSchema(messages)), async (c) => {
    const { cursor, limit, filter, sort } = c.req.valid('query');

    let where: SQL<unknown> | undefined = eq(messages.userId, c.var.clerkAuth!.userId!);
    if (filter) {
      where = and(where, filter);
    }

    const [foundMessages, messagesCount] = await Promise.all([
      db.query.messages.findMany({
        where,
        orderBy: sort,
        offset: cursor,
        limit: limit
      }),
      db
        .select({ count: count() })
        .from(messages)
        .where(where)
        .then((count) => count[0].count)
    ]);

    return c.json(
      {
        data: foundMessages,
        nextCursor: foundMessages.length < limit ? undefined : cursor + limit,
        count: messagesCount
      },
      200
    );
  })
  .get('/:id', async (c) => {
    return c.json(
      {
        data: c.var.message
      },
      200
    );
  })
  .patch(
    '/:id',
    zValidator(
      'json',
      createInsertSchema(messages).pick({
        content: true
      })
    ),
    async (c) => {
      const data = c.req.valid('json');
      const [message] = await db
        .update(messages)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(messages.id, c.var.message!.id))
        .returning();
      return c.json(
        {
          data: message
        },
        200
      );
    }
  )
  .delete('/:id', async (c) => {
    await db.delete(messages).where(eq(messages.id, c.var.message!.id));
    return c.json(
      {
        message: 'Message deleted successfully'
      },
      200
    );
  })
  .post(
    '/:id/reaction',
    zValidator(
      'json',
      createInsertSchema(messageReactions).pick({
        reaction: true,
        comment: true
      })
    ),
    async (c) => {
      const data = c.req.valid('json');
      const reaction = await db
        .insert(messageReactions)
        .values({
          ...data,
          messageId: c.var.message!.id,
          userId: c.var.clerkAuth!.userId!
        })
        .returning();
      return c.json(
        {
          data: reaction
        },
        201
      );
    }
  )
  .get('/:id/reaction', async (c) => {
    return c.json(
      {
        data: c.var.messageReaction
      },
      200
    );
  })
  .patch(
    '/:id/reaction',
    zValidator(
      'json',
      createInsertSchema(messageReactions).pick({
        reaction: true,
        comment: true
      })
    ),
    async (c) => {
      const data = c.req.valid('json');
      const reaction = await db
        .update(messageReactions)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(messageReactions.messageId, c.var.message!.id))
        .returning();
      return c.json(
        {
          data: reaction
        },
        200
      );
    }
  )
  .delete('/:id/reaction', async (c) => {
    await db.delete(messageReactions).where(eq(messageReactions.messageId, c.var.message!.id));
    return c.json(
      {
        message: 'Message reaction deleted successfully'
      },
      200
    );
  })
  .get('/:id/source-documents', async (c) => {
    const sourceDocumentRelations = await db.query.messagesToSourceDocuments.findMany({
      where: eq(messages.id, c.var.message.id)
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
