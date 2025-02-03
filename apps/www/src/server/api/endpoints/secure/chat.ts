import { createChatChain } from '@/ai/chat';
import { allChatModels, basicChatModels } from '@/ai/models';
import { db } from '@/core/database';
import { chats, messages as messagesTable } from '@/core/database/schema';
import { createId } from '@/core/utils/id';
import { getPosthog } from '@/core/utils/posthog';
import type { Bible } from '@/schemas/bibles/types';
import { MessageSchema } from '@/schemas/chats';
import type { Bindings, Variables } from '@/www/server/api/types';
import { getChatRateLimit, validateModelId } from '@/www/server/api/utils/chat';
import { getMessageId } from '@/www/utils/message';
import { zValidator } from '@hono/zod-validator';
import { createDataStream, smoothStream } from 'ai';
import { formatDate } from 'date-fns';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { getRequestEvent } from 'solid-js/web';
import { z } from 'zod';

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>()
  .use('/*', async (c, next) => {
    if (!c.var.user?.id) {
      return c.json({ message: 'You must be logged in to access this resource.' }, 401);
    }
    await next();
  })
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        messages: z.array(
          MessageSchema.partial()
            .required({
              id: true,
              role: true,
              content: true,
            })
            .passthrough(),
        ),
        chatId: z.string().nullish(),
        modelId: z.string().nullish(),
        bibleId: z.string().nullish(),
        additionalContext: z.string().nullish(),
      }),
    ),
    async (c) => {
      const pendingPromises: Promise<unknown>[] = []; // promises to wait for before closing the stream

      const input = c.req.valid('json');

      console.time('validateModelId');
      if (input.modelId) {
        const modelIdValidationResponse = await validateModelId({
          c,
          providedModelId: input.modelId,
        });
        if (modelIdValidationResponse) return modelIdValidationResponse;
      }
      console.timeEnd('validateModelId');
      const modelId = input.modelId ?? `${basicChatModels[0].host}:${basicChatModels[0].id}`;

      const modelInfo = allChatModels.find((m) => m.id === modelId.split(':')[1]);
      if (!modelInfo) {
        return c.json({ message: 'Invalid model provided' }, 400);
      }

      const ratelimit = await getChatRateLimit(c.var.user!, c.var.roles);
      const ratelimitResult = await ratelimit.limit(c.var.user!.id);
      if (!ratelimitResult.success) {
        return c.json(
          {
            message: `You have exceeded your daily chat limit. Upgrade to pro or try again at ${formatDate(ratelimitResult.reset, 'M/d/yy h:mm a')}.`,
          },
          429,
        );
      }

      const chatId = input.chatId ?? createId();
      console.time('getChat');
      let chat = await db.query.chats.findFirst({
        where: (chats, { eq }) => eq(chats.id, chatId),
      });
      if (chat) {
        if (chat.userId !== c.var.user!.id) {
          return c.json({ message: 'You are not authorized to access this chat' }, 403);
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

      console.time('validateBibleId');
      let bible: Bible | undefined;
      if (input.bibleId) {
        bible = await db.query.bibles.findFirst({
          where: (bibles, { eq }) => eq(bibles.id, input.bibleId!),
        });
        if (!bible) return c.json({ message: 'Invalid Bible ID' }, 400);
      } else if (c.var.settings?.preferredBibleId) {
        bible = await db.query.bibles.findFirst({
          where: (bibles, { eq }) => eq(bibles.id, c.var.settings!.preferredBibleId!),
        });
      }
      console.timeEnd('validateBibleId');

      const lastMessage = input.messages.at(-1);
      if (!lastMessage) {
        return c.json({ message: 'You must provide at least one message' }, 400);
      }

      console.time('saveMessage');
      const lastMessageId = getMessageId(lastMessage);
      const existingMessage = await db.query.messages.findFirst({
        where: (messages, { eq }) => eq(messages.id, lastMessageId),
      });
      if (existingMessage) {
        if (existingMessage.userId !== c.var.user!.id || existingMessage.chatId !== chat.id) {
          return c.json({ message: 'You are not authorized to access this message' }, 403);
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
          updatedAt: new Date(),
          chatId: chat.id,
          userId: c.var.user!.id,
        });
      }
      console.timeEnd('saveMessage');

      let pingInterval: Timer | undefined;
      const dataStream = createDataStream({
        execute: async (dataStream) => {
          // Ping the stream every 200ms to avoid idle connection timeout
          pingInterval = setInterval(() => dataStream.writeData('ping'), 200);

          if (input.chatId !== chat.id) {
            dataStream.writeData({ chatId: chat.id });
          }

          const streamText = await createChatChain({
            chat,
            modelInfo,
            user: c.var.user!,
            roles: c.var.roles,
            settings: c.var.settings,
            dataStream: dataStream,
            additionalContext: input.additionalContext,
            bible,
            onStepFinish: (step) => {
              dataStream.writeMessageAnnotation({ modelId });
              getPosthog()?.capture({
                distinctId: c.var.user!.id,
                event: 'chat step finished',
                properties: { modelId, step },
              });
            },
            onFinish: async (event) => {
              clearInterval(pingInterval);
              if (event.finishReason !== 'stop' && event.finishReason !== 'tool-calls') {
                pendingPromises.push(
                  ratelimit.resetUsedTokens(c.var.user!.id).then(() =>
                    ratelimit.limit(c.var.user!.id, {
                      rate: ratelimitResult.limit - ratelimitResult.remaining,
                    }),
                  ),
                );
              }
              await Promise.all(pendingPromises);
              getPosthog()?.capture({
                distinctId: c.var.user!.id,
                event: 'chat event finished',
                properties: { modelId, event },
              });
            },
            abortSignal: getRequestEvent()?.request.signal,
            experimental_toolCallStreaming: true,
            experimental_transform: smoothStream(),
          });

          const result = streamText();
          result.mergeIntoDataStream(dataStream);
        },
        onError: (error) => {
          clearInterval(pingInterval);
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
