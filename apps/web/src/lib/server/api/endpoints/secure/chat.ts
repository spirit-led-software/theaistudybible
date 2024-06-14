import type { JwtPayload } from '@clerk/types';
import { zValidator } from '@hono/zod-validator';
import { ConsoleCallbackHandler } from '@langchain/core/tracers/console';
import { cache } from '@lib/server/cache';
import { db } from '@lib/server/database';
import {
  chats,
  messages,
  messages as messagesTable,
  messagesToSourceDocuments
} from '@theaistudybible/core/database/schema';
import {
  freeTierModelIds,
  plusTierModelIds,
  type FreeTierModelId,
  type PlusTierModelId
} from '@theaistudybible/core/model/llm';
import { similarityFunctionMapping } from '@theaistudybible/core/model/source-document';
import { getTimeStringFromSeconds } from '@theaistudybible/core/util/date';
import { createId } from '@theaistudybible/core/util/id';
import { getRAIChatChain } from '@theaistudybible/langchain/lib/chains/chat';
import { UpstashVectorStoreDocument } from '@theaistudybible/langchain/vectorstores/upstash';
import { aiRenameChat } from '@theaistudybible/server/lib/chat';
import { getMaxQueryCountForUser, hasRole } from '@theaistudybible/server/lib/user';
import { Ratelimit } from '@upstash/ratelimit';
import { StreamingTextResponse, createStreamDataTransformer } from 'ai';
import { and, eq, sql } from 'drizzle-orm';
import { createSelectSchema } from 'drizzle-zod';
import { Context, Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '~/lib/server/api/types';

function validateModelId({
  c,
  providedModelId,
  claims
}: {
  c: Context<{
    Bindings: Bindings;
    Variables: Variables;
  }>;
  providedModelId: string;
  claims: JwtPayload;
}): Response | undefined {
  if (
    !freeTierModelIds.includes(providedModelId as FreeTierModelId) &&
    !plusTierModelIds.includes(providedModelId as PlusTierModelId)
  ) {
    console.log('Invalid modelId provided');
    c.json(
      {
        message: 'Invalid model ID provided'
      },
      400
    );
  }
  if (
    plusTierModelIds.includes(providedModelId as PlusTierModelId) &&
    !hasRole('rc:plus', claims) &&
    !hasRole('admin', claims)
  ) {
    return c.json(
      {
        message: `Your plan does not support this model. Please upgrade to a plan that supports this model.`
      },
      403
    );
  }
  return undefined;
}

function getDefaultModelId(claims: JwtPayload): FreeTierModelId | PlusTierModelId {
  return hasRole('rc:plus', claims) || hasRole('admin', claims)
    ? ('claude-3-opus-20240229' satisfies PlusTierModelId)
    : ('claude-3-haiku-20240307' satisfies FreeTierModelId);
}

const app = new Hono<{
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
              createdAt: z.string().transform((v) => new Date(v))
            }).pick({
              id: true,
              role: true,
              content: true,
              createdAt: true
            })
          )
          .nonempty()
      })
    ),
    async (c) => {
      const pendingPromises: Promise<unknown>[] = []; // promises to wait for before closing the stream
      const { messages, chatId, modelId: providedModelId } = await c.req.valid('json');

      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.role !== 'user' || !lastMessage.content) {
        console.log('Invalid last message');
        return c.json(
          {
            message: 'Invalid last message'
          },
          400
        );
      }

      const claims = c.var.clerkAuth!.sessionClaims!;
      const maxQueryCount = await getMaxQueryCountForUser(claims);
      const ratelimit = new Ratelimit({
        redis: cache,
        limiter: Ratelimit.slidingWindow(maxQueryCount, '3 h')
      });
      const ratelimitResult = await ratelimit.limit(claims.sub);
      if (!ratelimitResult.success) {
        console.log('Rate limit exceeded');
        return c.json(
          {
            message: `You have issued too many requests for your current plan. Please wait ${getTimeStringFromSeconds(
              ratelimitResult.remaining
            )} before trying again.`
          },
          429
        );
      }

      if (providedModelId) {
        const modelIdValidationResponse = validateModelId({ c, providedModelId, claims });
        if (modelIdValidationResponse) {
          return modelIdValidationResponse;
        }
      }
      const modelId = providedModelId ?? getDefaultModelId(claims);

      console.time('Validating chat');
      const [chat] = chatId
        ? await db.query.chats
            .findFirst({
              where: (chats, { eq }) => eq(chats.id, chatId)
            })
            .then(async (foundChat) => {
              if (!foundChat || foundChat.userId !== claims.sub) {
                return await db
                  .insert(chats)
                  .values({
                    userId: claims.sub
                  })
                  .returning();
              }
              return [foundChat];
            })
        : await db
            .insert(chats)
            .values({
              userId: claims.sub
            })
            .returning();

      console.timeEnd('Validating chat');
      if (!chat.customName) {
        pendingPromises.push(aiRenameChat(chat, messages));
      } else {
        // Hacky way to update the chat updated_at field
        pendingPromises.push(
          db.update(chats).set({ name: chat.name }).where(eq(chats.id, chat.id))
        );
      }

      console.time('Validating user message');
      const [userMessage] = await db.query.messages
        .findMany({
          where: (messages, { and, eq }) =>
            and(eq(messages.chatId, chat.id), eq(messages.id, lastMessage.id))
        })
        .then(async (userMessages) => {
          const userMessage = userMessages.at(0);
          if (userMessage) {
            pendingPromises.push(
              db
                .update(messagesTable)
                .set({
                  metadata: {
                    regenerated: true
                  }
                })
                .where(
                  and(
                    eq(messagesTable.originMessageId, userMessage.id),
                    eq(messagesTable.role, 'assistant')
                  )
                )
            );
            return [userMessage];
          }
          return await db
            .insert(messagesTable)
            .values({
              chatId: chat.id,
              userId: claims.sub,
              role: 'user',
              content: lastMessage.content
            })
            .returning();
        });
      console.timeEnd('Validating user message');

      const aiResponseId = createId();
      const chain = await getRAIChatChain({
        modelId: modelId as FreeTierModelId | PlusTierModelId,
        claims,
        messages
      });
      const lcStream = await chain
        .withConfig({
          callbacks: import.meta.env.DEV ? [new ConsoleCallbackHandler()] : undefined
        })
        .stream({
          query: lastMessage.content!
        });
      const createAiResponsePromise = db
        .insert(messagesTable)
        .values({
          id: aiResponseId,
          chatId: chat.id,
          userId: claims.sub,
          role: 'assistant'
        })
        .returning()
        .execute();
      pendingPromises.push(createAiResponsePromise);

      const textEncoder = new TextEncoder();
      let aggregatedResponse = '';
      const aiStream = lcStream
        .pipeThrough(
          new TransformStream({
            transform: async (chunk, controller) => {
              if ('text' in chunk) {
                controller.enqueue(textEncoder.encode(chunk.text));
                aggregatedResponse += chunk.text;
              }

              if ('sourceDocuments' in chunk) {
                console.log('Saving SourceDocuments', chunk.sourceDocuments);
                pendingPromises.push(
                  createAiResponsePromise.then(async () =>
                    Promise.all(
                      chunk.sourceDocuments!.map(async (sourceDoc: UpstashVectorStoreDocument) => {
                        await db.insert(messagesToSourceDocuments).values({
                          messageId: aiResponseId,
                          sourceDocumentId: sourceDoc.id.toString(),
                          distance: 1 - sourceDoc.score!,
                          distanceMetric: similarityFunctionMapping[sourceDoc.similarityFunction!]
                        });
                      })
                    )
                  )
                );
              }

              if ('searchQueries' in chunk) {
                pendingPromises.push(
                  createAiResponsePromise.then(async () =>
                    db
                      .update(messagesTable)
                      .set({
                        metadata: sql`metadata || ${{
                          searchQueries: chunk.searchQueries
                        }}`
                      })
                      .where(eq(messagesTable.id, aiResponseId))
                  )
                );
              }
            },
            flush: async () => {
              await Promise.all([
                ...pendingPromises,
                createAiResponsePromise.then(async () => {
                  await db
                    .update(messagesTable)
                    .set({
                      content: aggregatedResponse
                    })
                    .where(eq(messagesTable.id, aiResponseId))
                    .catch((e) => {
                      console.error('Error saving ai response:', e);
                    });
                })
              ]);
            }
          })
        )
        .pipeThrough(createStreamDataTransformer());

      return new StreamingTextResponse(aiStream, {
        headers: {
          'x-chat-id': chat.id,
          'x-user-message-id': userMessage.id,
          'x-ai-response-id': aiResponseId,
          'x-model-id': modelId
        }
      });
    }
  );

export default app;
