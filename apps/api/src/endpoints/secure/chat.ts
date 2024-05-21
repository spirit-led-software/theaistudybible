import { getCache } from '@api/lib/cache';
import { chatChain } from '@api/lib/chat/chain';
import { checkRole } from '@api/lib/user';
import type { Bindings, Variables } from '@api/types';
import { chats, messages as messagesTable } from '@core/database/schema';
import type { Chat } from '@core/model/chat';
import { zValidator } from '@hono/zod-validator';
import { Ratelimit } from '@upstash/ratelimit';
import { StreamingTextResponse } from 'ai';
import day from 'dayjs';
import { eq, sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { Hono } from 'hono';
import { v4 as uuidV4 } from 'uuid';
import { z } from 'zod';

export const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
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
  .use('/*', async (c, next) => {
    if (!checkRole('admin', c.var.clerkAuth?.sessionClaims)) {
      const ratelimit = new Ratelimit({
        redis: getCache(c.env),
        limiter: Ratelimit.slidingWindow(5, '2 h'),
        analytics: true,
        prefix: 'ratelimit:chat'
      });
      const result = await ratelimit.limit(c.var.clerkAuth!.userId!);
      if (!result.success) {
        const reset = new Date(result.reset);
        const timeRemaining = day(reset).diff(new Date(), 'minute');
        return c.json(
          {
            message: `Maximum number of requests exceeded (${result.limit}). Please try again in ${timeRemaining} minutes.`
          },
          429
        );
      }
    }

    await next();
  })
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        chatId: z.string().optional(),
        modelId: z.string().optional(),
        messages: z.array(
          createInsertSchema(messagesTable, {
            createdAt: z.string().transform((v) => new Date(v))
          })
            .partial()
            .required({
              id: true,
              role: true,
              content: true
            })
        )
      })
    ),
    async (c) => {
      const { chatId, modelId, messages } = c.req.valid('json');

      let chatPromise: Promise<Chat>;
      if (chatId) {
        chatPromise = c.var.db.query.chats
          .findFirst({
            where: eq(chats.id, chatId)
          })
          .then(async (chat) => {
            if (!chat) {
              [chat] = await c.var.db
                .insert(chats)
                .values({
                  name: 'New Chat',
                  userId: c.var.clerkAuth!.userId!
                })
                .returning();
            }
            return chat;
          });
      } else {
        chatPromise = c.var.db
          .insert(chats)
          .values({
            name: 'New Chat',
            userId: c.var.clerkAuth!.userId!
          })
          .returning()
          .then((chats) => chats[0]);
      }

      const lastMessage = messages.at(-1)!;
      const lastUserMessage = messages.findLast((m) => m.role === 'user');
      if (!lastUserMessage) {
        return c.json(
          {
            message: 'There must be a user message before an AI message.'
          },
          400
        );
      }

      c.executionCtx.waitUntil(
        c.var.db.query.messages
          .findFirst({
            where: eq(messagesTable.id, lastUserMessage.id)
          })
          .then(async (userMessage) => {
            if (!userMessage) {
              [userMessage] = await c.var.db
                .insert(messagesTable)
                // @ts-expect-error - We know this is the correct type
                .values({
                  ...lastUserMessage,
                  userId: c.var.clerkAuth!.userId!,
                  chatId: (await chatPromise).id
                })
                .returning();
            }
            return userMessage;
          })
      );

      if (lastMessage.role === 'assistant') {
        c.executionCtx.waitUntil(
          c.var.db
            .update(messagesTable)
            .set({
              metadata: sql`${messagesTable.metadata} || ${JSON.stringify({
                regenerated: true
              })}`
            })
            .where(eq(messagesTable.id, lastMessage.id))
        );
      }

      const aiResponseId = uuidV4();

      const aiStream = await chatChain({
        env: c.env,
        vars: c.var,
        chatId: (await chatPromise).id,
        userId: c.var.clerkAuth!.userId!,
        userMessageId: lastUserMessage.id,
        aiResponseId,
        modelId,
        // @ts-expect-error - We don't have a good way to type this yet
        messages
      });

      return new StreamingTextResponse(aiStream, {
        headers: {
          'X-Chat-ID': (await chatPromise).id,
          'X-AI-Response-ID': aiResponseId,
          'Content-Encoding': 'identity'
        }
      });
    }
  );

export default app;
