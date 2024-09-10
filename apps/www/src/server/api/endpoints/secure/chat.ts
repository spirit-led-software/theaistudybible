import { createChatChain, renameChat } from '@/ai/chat';
import { allModels } from '@/ai/models';
import { db } from '@/core/database';
import { chats, messages as messagesTable } from '@/core/database/schema';
import { checkAndConsumeCredits, restoreCreditsOnFailure } from '@/core/utils/credits';
import { MessageSchema } from '@/schemas/chats';
import type { Chat } from '@/schemas/chats/types';
import type { Bindings, Variables } from '@/www/server/api/types';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { getDefaultModelId, getValidMessages, validateModelId } from '../../utils/chat';

const maxResponseTokens = 4096;

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>()
  .use('/*', async (c, next) => {
    if (!c.var.clerkAuth?.userId) {
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
        messages: MessageSchema.partial()
          .required({
            id: true,
            content: true,
            role: true,
            createdAt: true,
          })
          .passthrough()
          .array(),
      }),
    ),
    async (c) => {
      const pendingPromises: Promise<unknown>[] = []; // promises to wait for before closing the stream
      const { messages: providedMessages, chatId, modelId: providedModelId } = c.req.valid('json');

      const claims = c.var.clerkAuth!.sessionClaims!;

      console.time('checkAndConsumeCredits');
      const hasCredits = await checkAndConsumeCredits(claims.sub, 'chat');
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
        const modelIdValidationResponse = validateModelId({ c, providedModelId, claims });
        if (modelIdValidationResponse) {
          return modelIdValidationResponse;
        }
      }
      console.timeEnd('validateModelId');
      const modelId = providedModelId ?? getDefaultModelId(claims);

      console.time('getChat');
      let chat: Chat;
      if (chatId) {
        [chat] = await db.query.chats
          .findFirst({
            where: (chats, { eq }) => eq(chats.id, chatId),
          })
          .then(async (foundChat) => {
            if (!foundChat || foundChat.userId !== claims.sub) {
              return await db
                .insert(chats)
                .values({
                  userId: claims.sub,
                })
                .returning()
                .execute();
            }
            return [foundChat];
          });
      } else {
        [chat] = await db
          .insert(chats)
          .values({
            userId: claims.sub,
          })
          .returning()
          .execute();
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
              .set(lastMessage)
              .where(eq(messagesTable.id, message.id))
              .returning()
              .execute();
          }
          return await db
            .insert(messagesTable)
            .values({
              ...lastMessage,
              chatId: chat.id,
              userId: claims.sub,
            })
            .returning()
            .execute();
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
        userId: claims.sub,
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

      const streamText = createChatChain({
        modelId,
        chatId: chat.id,
        userMessageId: lastUserMessage.id,
        userId: claims.sub,
        sessionClaims: claims,
        maxTokens: maxResponseTokens,
        onFinish: async (event) => {
          await Promise.all(pendingPromises);
          if (event.finishReason !== 'stop' && event.finishReason !== 'tool-calls') {
            await restoreCreditsOnFailure(claims.sub, 'chat');
          }
        },
      });

      const { streamTextResult, responseId } = await streamText(messages);
      return streamTextResult.toDataStreamResponse({
        init: {
          headers: {
            'x-chat-id': chat.id,
            'x-response-id': responseId,
            'x-model-id': modelId,
          },
        },
      });
    },
  );

export default app;
