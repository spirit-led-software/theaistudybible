import { zValidator } from '@hono/zod-validator';
import { db } from '@lib/server/database';
import { PaginationSchema } from '@theaistudybible/api/lib/utils/pagination';
import type { Bindings, Variables } from '@theaistudybible/api/types';
import { chats, messages } from '@theaistudybible/core/database/schema';
import type { Chat } from '@theaistudybible/core/model/chat';
import { hasRole } from '@theaistudybible/server/lib/user';
import { SQL, and, count, eq } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { Hono } from 'hono';

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables & {
    chat: Chat;
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
    const chat = await db.query.chats.findFirst({
      where: (chats, { eq }) => eq(chats.id, id)
    });
    if (!chat) {
      return c.json(
        {
          message: 'Chat not found'
        },
        404
      );
    }

    if (
      c.var.clerkAuth?.userId !== chat.userId &&
      !hasRole('admin', c.var.clerkAuth!.sessionClaims!)
    ) {
      return c.json(
        {
          message: 'You do not have permission to access this resource.'
        },
        403
      );
    }

    c.set('chat', chat);
    await next();
  })
  .post(
    '/',
    zValidator(
      'json',
      createInsertSchema(chats).pick({
        name: true,
        customName: true
      })
    ),
    async (c) => {
      const chatData = c.req.valid('json');
      const [chat] = await db
        .insert(chats)
        .values({
          ...chatData,
          userId: c.var.clerkAuth!.userId!
        })
        .returning();
      return c.json(
        {
          message: 'Chat created successfully',
          data: chat
        },
        201
      );
    }
  )
  .get(
    '/',
    zValidator('query', PaginationSchema(chats), (result, c) => {
      if (!result.success) {
        return c.json({ message: 'Invalid query parameters', data: result.error }, 400);
      }
    }),
    async (c) => {
      const { cursor, limit, filter, sort } = c.req.valid('query');

      let where = eq(chats.userId, c.var.clerkAuth!.userId!);
      if (filter) {
        where = and(where, filter)!;
      }

      const [foundChats, chatCount] = await Promise.all([
        db.query.chats.findMany({
          where,
          limit,
          offset: cursor,
          orderBy: sort
        }),
        db
          .select({ count: count() })
          .from(chats)
          .where(where)
          .then((chatCount) => chatCount[0].count)
      ]);

      return c.json(
        {
          data: foundChats,
          nextCursor: foundChats.length < limit ? undefined : cursor + limit,
          count: chatCount
        },
        200
      );
    }
  )
  .get('/:id', async (c) => {
    return c.json(
      {
        data: c.var.chat
      },
      200
    );
  })
  .patch(
    '/:id',
    zValidator(
      'json',
      createInsertSchema(chats).pick({
        name: true,
        customName: true
      })
    ),
    async (c) => {
      const chatData = c.req.valid('json');
      const [chat] = await db
        .update(chats)
        .set({
          ...chatData,
          updatedAt: new Date()
        })
        .where(eq(chats.id, c.var.chat!.id))
        .returning();
      return c.json(
        {
          message: 'Chat updated successfully',
          data: chat
        },
        200
      );
    }
  )
  .delete('/:id', async (c) => {
    await db.delete(chats).where(eq(chats.id, c.var.chat!.id));
    return c.json(
      {
        message: 'Chat deleted successfully'
      },
      200
    );
  })
  .get('/:id/messages', zValidator('query', PaginationSchema(messages)), async (c) => {
    const { cursor, limit, filter, sort } = c.req.valid('query');

    let where: SQL<unknown> | undefined = eq(messages.chatId, c.var.chat!.id);
    if (filter) {
      where = and(where, filter);
    }

    const [foundMessages, messageCount] = await Promise.all([
      db.query.messages.findMany({
        where,
        limit,
        offset: cursor,
        orderBy: sort
      }),
      db
        .select({ count: count() })
        .from(messages)
        .where(where)
        .then((messageCount) => messageCount[0].count)
    ]);

    return c.json(
      {
        data: messages,
        nextCursor: foundMessages.length < limit ? undefined : cursor + limit,
        count: messageCount
      },
      200
    );
  });

export default app;
