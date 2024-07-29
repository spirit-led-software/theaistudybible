import { zValidator } from '@hono/zod-validator';
import { db } from '@theaistudybible/core/database';
import { chats, messages } from '@theaistudybible/core/database/schema';
import type { Chat } from '@theaistudybible/core/model/chat';
import { SQL, and, count, eq } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { Hono } from 'hono';
import type { Bindings, Variables } from '~/server/api/types';
import { PaginationSchema } from '~/server/api/utils/pagination';

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables & {
    chat: Chat | undefined;
  };
}>()
  .use('/:id/*', async (c, next) => {
    const chat = await db.query.chats.findFirst({
      where: ({ id }, { eq }) => eq(id, c.req.param('id'))
    });
    if (!chat) {
      return c.json(
        {
          message: 'Chat not found'
        },
        404
      );
    }

    c.set('chat', chat);
    await next();
  })
  .post('/', zValidator('json', createInsertSchema(chats)), async (c) => {
    const chatData = c.req.valid('json');
    const chat = (
      await db
        .insert(chats)
        .values({
          ...chatData,
          userId: chatData.userId ?? c.var.clerkAuth!.userId!
        })
        .returning()
    )[0];
    return c.json(
      {
        message: 'Chat created successfully',
        data: chat
      },
      201
    );
  })
  .get('/', zValidator('query', PaginationSchema(chats)), async (c) => {
    const { cursor, limit, filter, sort } = c.req.valid('query');

    const [foundChats, chatCount] = await Promise.all([
      db.query.chats.findMany({
        where: filter,
        limit,
        offset: cursor,
        orderBy: sort
      }),
      db
        .select({ count: count() })
        .from(chats)
        .where(filter)
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
  })
  .get('/:id', async (c) => {
    return c.json(
      {
        data: c.var.chat
      },
      200
    );
  })
  .patch('/:id', zValidator('json', createInsertSchema(chats)), async (c) => {
    const chatData = c.req.valid('json');
    const chat = (
      await db.update(chats).set(chatData).where(eq(chats.id, c.var.chat!.id)).returning()
    )[0];
    return c.json(
      {
        message: 'Chat updated successfully',
        data: chat
      },
      200
    );
  })
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
        data: foundMessages,
        nextCursor: foundMessages.length < limit ? undefined : cursor + limit,
        count: messageCount
      },
      200
    );
  });

export default app;
