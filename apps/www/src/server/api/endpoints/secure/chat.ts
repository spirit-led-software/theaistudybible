import { createChatChain, renameChat } from '@/ai/chat';
import { allModels } from '@/ai/models';
import { numTokensFromString } from '@/ai/utils';
import { db } from '@/core/database';
import { chats, messages as messagesTable } from '@/core/database/schema';
import { checkAndConsumeCredits, restoreCreditsOnFailure } from '@/core/utils/credits';
import { createId } from '@/core/utils/id';
import { MessageSchema } from '@/schemas/chats';
import type { Bindings, Variables } from '@/www/server/api/types';
import {
  getDefaultModelId,
  getMessageId,
  getValidMessages,
  validateModelId,
} from '@/www/server/api/utils/chat';
import { zValidator } from '@hono/zod-validator';
import { StreamData } from 'ai';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { z } from 'zod';

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
        messages: z.array(
          MessageSchema.merge(
            z.object({
              createdAt: z.string().datetime(),
              updatedAt: z.string().datetime(),
            }),
          )
            .partial()
            .required({
              id: true,
              role: true,
              content: true,
            })
            .passthrough(),
        ),
        chatId: z.string().nullish(),
        modelId: z.string().nullish(),
        additionalContext: z.string().nullish(),
      }),
    ),
    async (c) => {
      const pendingPromises: Promise<unknown>[] = []; // promises to wait for before closing the stream

      const body = c.req.valid('json');
      const providedMessages = body.messages;
      const providedChatId = body.chatId;
      const providedModelId = body.modelId;
      const additionalContext = body.additionalContext;

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

      const modelInfo = allModels.find((m) => m.id === modelId.split(':')[1]);
      if (!modelInfo) {
        return c.json(
          {
            message: 'Invalid model provided',
          },
          400,
        );
      }

      console.time('checkAndConsumeCredits');
      const hasCredits = await checkAndConsumeCredits(
        c.var.user!.id,
        modelInfo.tier === 'plus' ? 'advanced-chat' : 'chat',
      );
      console.timeEnd('checkAndConsumeCredits');
      if (!hasCredits) {
        return c.json(
          {
            message: `You must have at least ${modelInfo.tier === 'plus' ? 5 : 1} credit to use this resource.`,
          },
          400,
        );
      }

      const chatId = providedChatId ?? createId();
      console.time('getChat');
      let chat = await db.query.chats.findFirst({
        where: (chats, { eq }) => eq(chats.id, chatId),
      });
      if (chat) {
        if (chat.userId !== c.var.user!.id) {
          return c.json(
            {
              message: 'You are not authorized to access this chat',
            },
            403,
          );
        }
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
      const lastMessageId = getMessageId(lastMessage);
      const existingMessage = await db.query.messages.findFirst({
        where: (messages, { eq }) => eq(messages.id, lastMessageId),
      });
      if (existingMessage) {
        if (existingMessage.userId !== c.var.user!.id || existingMessage.chatId !== chat.id) {
          return c.json(
            {
              message: 'You are not authorized to access this message',
            },
            403,
          );
        }
        await db
          .update(messagesTable)
          .set({
            ...lastMessage,
            createdAt: lastMessage.createdAt ? new Date(lastMessage.createdAt) : undefined,
            updatedAt: new Date(),
          })
          .where(eq(messagesTable.id, existingMessage.id));
      } else {
        await db.insert(messagesTable).values({
          ...lastMessage,
          createdAt: lastMessage.createdAt ? new Date(lastMessage.createdAt) : undefined,
          updatedAt: new Date(),
          chatId: chat.id,
          userId: c.var.user!.id,
        });
      }
      console.timeEnd('saveMessage');

      let additionalContextTokens = 0;
      if (additionalContext) {
        additionalContextTokens = numTokensFromString({ text: additionalContext });
      }

      console.time('getValidMessages');
      const messages = await getValidMessages({
        userId: c.var.user!.id,
        chatId: chat.id,
        maxTokens: modelInfo.contextSize - additionalContextTokens - maxResponseTokens,
        mustStartWithUserMessage: modelInfo.provider === 'anthropic',
      });
      console.timeEnd('getValidMessages');

      if (!chat.customName) {
        pendingPromises.push(
          renameChat({
            chatId: chat.id,
            messages,
            additionalContext,
          }),
        );
      } else {
        pendingPromises.push(
          db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chat.id)).execute(),
        );
      }

      const lastUserMessage = messages.find((m) => m.role === 'user')!;

      const streamData = new StreamData();
      const streamText = createChatChain({
        modelId,
        chatId: chat.id,
        userMessageId: lastUserMessage.id,
        userId: c.var.user!.id,
        streamData,
        additionalContext,
        maxTokens: maxResponseTokens,
        onStepFinish: (step) => {
          streamData.appendMessageAnnotation({ modelId });
          globalThis.posthog?.capture({
            distinctId: c.var.user!.id,
            event: 'chat step finished',
            properties: {
              modelId,
              step,
            },
          });
        },
        onFinish: async (event) => {
          await Promise.all(pendingPromises);
          if (event.finishReason !== 'stop' && event.finishReason !== 'tool-calls') {
            await restoreCreditsOnFailure(c.var.user!.id, 'chat');
          }
          await streamData.close();
          globalThis.posthog?.capture({
            distinctId: c.var.user!.id,
            event: 'chat event finished',
            properties: {
              modelId,
              event,
            },
          });
        },
      });

      const result = await streamText(messages);

      return stream(c, async (stream) => {
        if (providedChatId !== chat.id) {
          c.header('X-Chat-Id', chat.id);
        }

        // Mark the response as a v1 data stream:
        c.header('X-Vercel-AI-Data-Stream', 'v1');
        c.header('Content-Type', 'text/plain; charset=utf-8');

        await stream.pipe(result.toDataStream({ data: streamData }));
      });
    },
  );

export default app;
