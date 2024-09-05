import { createChatChain, renameChat } from '@/ai/chat';
import { allModels } from '@/ai/models';
import type { Bindings, Variables } from '@/api/types';
import { db } from '@/core/database';
import { chats, messages, messages as messagesTable } from '@/core/database/schema';
import type { Chat } from '@/schemas/chats/types';
import { zValidator } from '@hono/zod-validator';
import type { ToolInvocation } from 'ai';
import { StreamingTextResponse } from 'ai';
import { eq } from 'drizzle-orm';
import { createSelectSchema } from 'drizzle-zod';
import { Hono } from 'hono';
import { z } from 'zod';
import {
  getDefaultModelId,
  getValidMessages,
  rateLimitChat,
  validateModelId,
} from '../../utils/chat';

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
        messages: z
          .array(
            createSelectSchema(messages, {
              createdAt: z
                .string()
                .optional()
                .transform((v) => (v ? new Date(v) : undefined)),
              toolInvocations: z
                .array(z.any())
                .optional()
                .transform((v) => v || (undefined as ToolInvocation[] | undefined)),
            }).pick({
              id: true,
              role: true,
              content: true,
              createdAt: true,
              toolInvocations: true,
            }),
          )
          .nonempty(),
      }),
    ),
    async (c) => {
      const pendingPromises: Promise<unknown>[] = []; // promises to wait for before closing the stream
      const { messages: providedMessages, chatId, modelId: providedModelId } = c.req.valid('json');

      const claims = c.var.clerkAuth!.sessionClaims!;
      const rateLimitResult = await rateLimitChat({ c, claims });
      if (rateLimitResult) {
        return rateLimitResult;
      }

      if (providedModelId) {
        const modelIdValidationResponse = validateModelId({ c, providedModelId, claims });
        if (modelIdValidationResponse) {
          return modelIdValidationResponse;
        }
      }
      const modelId = providedModelId ?? getDefaultModelId(claims);

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

      const lastMessage = providedMessages[providedMessages.length - 1];
      if (!lastMessage) {
        return c.json(
          {
            message: 'You must provide at least one message',
          },
          400,
        );
      }

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

      const modelInfo = allModels.find((m) => m.id === modelId.split(':')[1]);
      if (!modelInfo) {
        return c.json(
          {
            message: 'Invalid model provided',
          },
          400,
        );
      }

      const messages = await getValidMessages({
        userId: claims.sub,
        chatId: chat.id,
        maxTokens: modelInfo.contextSize - maxResponseTokens,
        mustStartWithUserMessage: modelInfo.provider === 'anthropic',
      });

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
      });

      const { streamTextResult, streamData, responseId } = await streamText(messages);

      const aiStream = streamTextResult.toAIStream({
        onFinal: async () => {
          await Promise.all(pendingPromises);
          await streamData.close();
        },
      });
      return new StreamingTextResponse(
        aiStream,
        {
          headers: {
            'x-chat-id': chat.id,
            'x-response-id': responseId,
            'x-model-id': modelId,
          },
        },
        streamData,
      );
    },
  );

export default app;
