import { createChatChain, renameChat } from '@/ai/chat';
import { allChatModels } from '@/ai/models';
import { numTokensFromString } from '@/ai/utils';
import { db } from '@/core/database';
import { chats, messages as messagesTable } from '@/core/database/schema';
import { checkAndConsumeCredits, restoreCreditsOnFailure } from '@/core/utils/credits';
import { createId } from '@/core/utils/id';
import { MessageSchema } from '@/schemas/chats';
import type { Bindings, Variables } from '@/www/server/api/types';
import { getDefaultModelId, getValidMessages, validateModelId } from '@/www/server/api/utils/chat';
import { getMessageId } from '@/www/utils/message';
import { zValidator } from '@hono/zod-validator';
import { createDataStream } from 'ai';
import { parseISO } from 'date-fns';
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

      const input = c.req.valid('json');

      console.time('validateModelId');
      if (input.modelId) {
        const modelIdValidationResponse = validateModelId({
          c,
          providedModelId: input.modelId,
        });
        if (modelIdValidationResponse) {
          return modelIdValidationResponse;
        }
      }
      console.timeEnd('validateModelId');
      const modelId = input.modelId ?? getDefaultModelId(c);

      const modelInfo = allChatModels.find((m) => m.id === modelId.split(':')[1]);
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
        modelInfo.tier === 'advanced' ? 'advanced-chat' : 'chat',
      );
      console.timeEnd('checkAndConsumeCredits');
      if (!hasCredits) {
        return c.json(
          {
            message: `You must have at least ${modelInfo.tier === 'advanced' ? 5 : 1} credit to use this resource.`,
          },
          400,
        );
      }

      const chatId = input.chatId ?? createId();
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
            id: chatId,
            userId: c.var.user!.id,
          })
          .returning();
      }
      console.timeEnd('getChat');

      const lastMessage = input.messages.at(-1);
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
          createdAt: lastMessage.createdAt ? parseISO(lastMessage.createdAt) : undefined,
          updatedAt: new Date(),
          chatId: chat.id,
          userId: c.var.user!.id,
        });
      }
      console.timeEnd('saveMessage');

      let additionalContextTokens = 0;
      if (input.additionalContext) {
        additionalContextTokens = numTokensFromString({ text: input.additionalContext });
      }

      console.time('getValidMessages');
      const messages = await getValidMessages({
        userId: c.var.user!.id,
        chatId: chat.id,
        maxTokens: modelInfo.contextSize - additionalContextTokens - maxResponseTokens,
        mustStartWithUserMessage: modelInfo.host === 'anthropic',
      });
      console.timeEnd('getValidMessages');

      if (!chat.customName) {
        pendingPromises.push(
          renameChat({
            chatId: chat.id,
            messages,
            additionalContext: input.additionalContext,
          }),
        );
      } else {
        pendingPromises.push(
          db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chat.id)).execute(),
        );
      }

      const lastUserMessage = messages.find((m) => m.role === 'user')!;

      const dataStream = createDataStream({
        execute: (dataStream) => {
          if (input.chatId !== chat.id) {
            dataStream.writeData({ chatId: chat.id });
          }

          const streamText = createChatChain({
            modelId,
            chatId: chat.id,
            userMessageId: getMessageId(lastUserMessage),
            userId: c.var.user!.id,
            dataStream: dataStream,
            additionalContext: input.additionalContext,
            maxTokens: maxResponseTokens,
            onStepFinish: (step) => {
              dataStream.writeMessageAnnotation({ modelId });
              globalThis.posthog?.capture({
                distinctId: c.var.user!.id,
                event: 'chat step finished',
                properties: { modelId, step },
              });
            },
            onFinish: async (event) => {
              if (event.finishReason !== 'stop' && event.finishReason !== 'tool-calls') {
                pendingPromises.push(restoreCreditsOnFailure(c.var.user!.id, 'chat'));
              }
              await Promise.all(pendingPromises);
              globalThis.posthog?.capture({
                distinctId: c.var.user!.id,
                event: 'chat event finished',
                properties: { modelId, event },
              });
            },
          });

          const result = streamText(messages);
          result.mergeIntoDataStream(dataStream);
        },
        onError: (error) => {
          return error instanceof Error ? error.message : String(error);
        },
      });

      // Mark the response as a v1 data stream:
      c.header('X-Vercel-AI-Data-Stream', 'v1');
      c.header('Content-Type', 'text/plain; charset=utf-8');

      return stream(c, (stream) => stream.pipe(dataStream));
    },
  );

export default app;
