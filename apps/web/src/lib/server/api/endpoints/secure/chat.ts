import type { JwtPayload } from '@clerk/types';
import { zValidator } from '@hono/zod-validator';
import { createChatChain, renameChat } from '@theaistudybible/ai/chat';
import {
  freeTierModelIds,
  freeTierModels,
  plusTierModelIds,
  plusTierModels,
  type FreeTierModelId,
  type PlusTierModelId
} from '@theaistudybible/ai/models';
import { cache } from '@theaistudybible/core/cache';
import { db } from '@theaistudybible/core/database';
import { chats, messages, messages as messagesTable } from '@theaistudybible/core/database/schema';
import { getMaxQueryCountForUser, hasRole } from '@theaistudybible/core/user';
import { getTimeStringFromSeconds } from '@theaistudybible/core/util/date';
import { StreamingTextResponse, ToolInvocation } from 'ai';
import { and, eq } from 'drizzle-orm';
import { createSelectSchema } from 'drizzle-zod';
import { Context, Hono } from 'hono';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
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
    ? process.env.NODE_ENV === 'production'
      ? `${plusTierModels[0].provider}:${plusTierModels[0].id}`
      : `${freeTierModels[0].provider}:${freeTierModels[0].id}`
    : `${freeTierModels[0].provider}:${freeTierModels[0].id}`;
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
              createdAt: z.string().transform((v) => new Date(v)),
              toolInvocations: z
                .array(z.any())
                .optional()
                .transform((v) => v || (undefined as ToolInvocation[] | undefined))
            }).pick({
              id: true,
              role: true,
              content: true,
              createdAt: true,
              toolInvocations: true
            })
          )
          .nonempty()
      })
    ),
    async (c) => {
      const pendingPromises: Promise<unknown>[] = []; // promises to wait for before closing the stream
      const { messages, chatId, modelId: providedModelId } = await c.req.valid('json');

      const lastMessage = messages[messages.length - 1];

      const claims = c.var.clerkAuth!.sessionClaims!;
      const maxQueryCount = await getMaxQueryCountForUser(claims);
      const ratelimit = new RateLimiterRedis({
        storeClient: cache,
        points: maxQueryCount,
        duration: 3 * 60 * 60
      });
      try {
        await ratelimit.consume(claims.sub);
      } catch (ratelimitResult) {
        if (ratelimitResult instanceof RateLimiterRes) {
          return c.json(
            {
              message: `You have issued too many requests for your current plan. Please wait ${getTimeStringFromSeconds(
                ratelimitResult.msBeforeNext / 1000
              )} before trying again.`
            },
            {
              status: 429,
              headers: {
                'Retry-After': (ratelimitResult.msBeforeNext / 1000).toString(),
                'X-RateLimit-Limit': maxQueryCount.toString(),
                'X-RateLimit-Remaining': ratelimitResult.remainingPoints.toString(),
                'X-RateLimit-Reset': new Date(
                  Date.now() + ratelimitResult.msBeforeNext
                ).toISOString()
              }
            }
          );
        } else {
          return c.json(
            {
              message: 'An error occurred. Please try again later.'
            },
            500
          );
        }
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
        pendingPromises.push(renameChat(chat.id, messages));
      } else {
        // Hacky way to update the chat updated_at field
        pendingPromises.push(
          db.update(chats).set({ name: chat.name }).where(eq(chats.id, chat.id)).execute()
        );
      }

      console.time('Validating user message');
      const [userMessage] = await db.query.messages
        .findFirst({
          where: (messages, { eq }) => eq(messages.id, lastMessage.id)
        })
        .then(async (userMessage) => {
          if (userMessage) {
            pendingPromises.push(
              db
                .update(messagesTable)
                .set({
                  regenerated: true
                })
                .where(
                  and(
                    eq(messagesTable.originMessageId, userMessage.id),
                    eq(messagesTable.role, 'assistant')
                  )
                )
                .execute()
            );
            return [userMessage];
          }
          return await db
            .insert(messagesTable)
            .values({
              id: lastMessage.id,
              chatId: chat.id,
              userId: claims.sub,
              role: lastMessage.role,
              content: lastMessage.content,
              toolInvocations: lastMessage.toolInvocations as unknown as ToolInvocation[]
            })
            .returning()
            .execute();
        });
      console.timeEnd('Validating user message');

      const streamText = await createChatChain({
        modelId,
        chatId: chat.id,
        userId: claims.sub,
        sessionClaims: claims
      });
      const { streamTextResult, responseId } = await streamText(messages);
      const aiStream = streamTextResult.toAIStream({
        onFinal: async () => {
          await Promise.all(pendingPromises);
        }
      });

      return new StreamingTextResponse(aiStream, {
        headers: {
          'X-Chat-ID': chat.id,
          'X-User-Message-ID': userMessage.id,
          'X-Response-ID': responseId
        }
      });
    }
  );

export default app;
