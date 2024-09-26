import { createChatChain, renameChat } from '@/ai/chat';
import { allModels } from '@/ai/models';
import { db } from '@/core/database';
import { chats, messages as messagesTable } from '@/core/database/schema';
import { checkAndConsumeCredits, restoreCreditsOnFailure } from '@/core/utils/credits';
import { MessageSchema } from '@/schemas/chats';
import type { Chat } from '@/schemas/chats/types';
import type { Bindings, Variables } from '@/www/server/api/types';
import { zValidator } from '@hono/zod-validator';
import { StreamData } from 'ai';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { z } from 'zod';
import { getDefaultModelId, getValidMessages, validateModelId } from '../../utils/chat';

const maxResponseTokens = 4096;

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>()
  .use('/*', async (c, next) => {
    if (!c.var.user?.id) {
      return c.json(
        {
          message: 'You must be logged in to access this resource.',
        },
        401,
      );
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
        messages: MessageSchema.merge(
          z.object({
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
          }),
        )
          .partial()
          .required({
            id: true,
            content: true,
            role: true,
          })
          .passthrough()
          .array(),
      }),
    ),
    async (c) => {
      const pendingPromises: Promise<unknown>[] = []; // promises to wait for before closing the stream
      const { messages: providedMessages, chatId, modelId: providedModelId } = c.req.valid('json');

      console.time('checkAndConsumeCredits');
      const hasCredits = await checkAndConsumeCredits(c.var.user!.id, 'chat');
      console.timeEnd('checkAndConsumeCredits');
      if (!hasCredits) {
        return c.json(
          {
            message: 'You must have at least 1 credit to use this resource.',
          },
          400,
        );
      }

      console.time('validateModelId');
      if (providedModelId) {
        const modelIdValidationResponse = validateModelId({
          c,
          providedModelId,
        });
        if (modelIdValidationResponse) {
          return modelIdValidationResponse;
        }
      }
      console.timeEnd('validateModelId');
      const modelId = providedModelId ?? getDefaultModelId(c);

      console.time('getChat');
      let chat: Chat;
      if (chatId) {
        chat = await db.query.chats
          .findFirst({
            where: (chats, { eq }) => eq(chats.id, chatId),
          })
          .then(async (foundChat) => {
            if (!foundChat || foundChat.userId !== c.var.user!.id) {
              const [newChat] = await db
                .insert(chats)
                .values({
                  userId: c.var.user!.id,
                })
                .returning();
              return newChat;
            }
            return foundChat;
          });
      } else {
        [chat] = await db
          .insert(chats)
          .values({
            userId: c.var.user!.id,
          })
          .returning();
      }
      console.timeEnd('getChat');

      const lastMessage = providedMessages[providedMessages.length - 1];
      if (!lastMessage) {
        return c.json(
          {
            message: 'You must provide at least one message',
          },
          400,
        );
      }

      console.time('saveMessage');
      await db.query.messages
        .findFirst({
          where: (messages, { eq }) => eq(messages.id, lastMessage.id),
        })
        .then(async (message) => {
          if (message) {
            return await db
              .update(messagesTable)
              .set({
                ...lastMessage,
                createdAt: lastMessage.createdAt ? new Date(lastMessage.createdAt) : undefined,
                updatedAt: new Date(),
              })
              .where(eq(messagesTable.id, message.id))
              .returning();
          }
          return await db
            .insert(messagesTable)
            .values({
              ...lastMessage,
              createdAt: lastMessage.createdAt ? new Date(lastMessage.createdAt) : undefined,
              updatedAt: new Date(),
              chatId: chat.id,
              userId: c.var.user!.id,
            })
            .returning();
        });
      console.timeEnd('saveMessage');

      const modelInfo = allModels.find((m) => m.id === modelId.split(':')[1]);
      if (!modelInfo) {
        return c.json(
          {
            message: 'Invalid model provided',
          },
          400,
        );
      }

      console.time('getValidMessages');
      const messages = await getValidMessages({
        userId: c.var.user!.id,
        chatId: chat.id,
        maxTokens: modelInfo.contextSize - maxResponseTokens,
        mustStartWithUserMessage: modelInfo.provider === 'anthropic',
      });
      console.timeEnd('getValidMessages');

      const lastUserMessage = messages.find((m) => m.role === 'user')!;

      if (!chat.customName) {
        pendingPromises.push(renameChat(chat.id, messages));
      } else {
        // Hacky way to update the chat updatedAt field
        pendingPromises.push(
          db
            .update(chats)
            .set({
              updatedAt: new Date(),
            })
            .where(eq(chats.id, chat.id))
            .execute(),
        );
      }

      const streamData = new StreamData();
      const streamText = createChatChain({
        modelId,
        chatId: chat.id,
        userMessageId: lastUserMessage.id,
        userId: c.var.user!.id,
        streamData,
        maxTokens: maxResponseTokens,
        onFinish: async (event) => {
          await Promise.all(pendingPromises);
          if (event.finishReason !== 'stop' && event.finishReason !== 'tool-calls') {
            await restoreCreditsOnFailure(c.var.user!.id, 'chat');
          }
          await streamData.close();
        },
      });

      const result = await streamText(messages);

      return stream(c, async (stream) => {
        c.header('X-Chat-Id', chat.id);
        c.header('X-Model-Id', modelId);

        // Mark the response as a v1 data stream:
        c.header('X-Vercel-AI-Data-Stream', 'v1');
        c.header('Content-Type', 'text/plain; charset=utf-8');

        await stream.pipe(result.toDataStream({ data: streamData }));
      });
    },
  );

export default app;
