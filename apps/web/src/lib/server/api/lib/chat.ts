import { JwtPayload, Variables } from '@clerk/types';
import {
  FreeTierModelId,
  PlusTierModelId,
  freeTierModels,
  plusTierModels
} from '@theaistudybible/ai/models';
import { numTokensFromString } from '@theaistudybible/ai/util';
import { cache } from '@theaistudybible/core/cache';
import { db } from '@theaistudybible/core/database';
import { getMaxQueryCountForUser, hasRole } from '@theaistudybible/core/user';
import { getTimeStringFromSeconds } from '@theaistudybible/core/util/date';
import { Context } from 'hono';
import { Bindings } from 'hono/types';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';

export function validateModelId({
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
  const isFreeTier = freeTierModels.some(
    (model) => `${model.provider}:${model.id}` === providedModelId
  );
  const isPlusTier = plusTierModels.some(
    (model) => `${model.provider}:${model.id}` === providedModelId
  );
  if (!isFreeTier && !isPlusTier) {
    console.log('Invalid modelId provided');
    c.json(
      {
        message: 'Invalid model ID provided'
      },
      400
    );
  }
  if (isPlusTier && !hasRole('rc:plus', claims) && !hasRole('admin', claims)) {
    return c.json(
      {
        message: `Your plan does not support this model. Please upgrade to a plan that supports this model.`
      },
      403
    );
  }
  return undefined;
}

export function getDefaultModelId(claims: JwtPayload): FreeTierModelId | PlusTierModelId {
  return hasRole('rc:plus', claims) || hasRole('admin', claims)
    ? process.env.NODE_ENV === 'production'
      ? `${plusTierModels[0].provider}:${plusTierModels[0].id}`
      : `${freeTierModels[0].provider}:${freeTierModels[0].id}`
    : `${freeTierModels[0].provider}:${freeTierModels[0].id}`;
}

export async function rateLimitChat({
  c,
  claims
}: {
  c: Context<{
    Bindings: Bindings;
    Variables: Variables;
  }>;
  claims: JwtPayload;
}) {
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
            'X-RateLimit-Reset': new Date(Date.now() + ratelimitResult.msBeforeNext).toISOString()
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
}

const messageChunkSize = 10;
export async function getValidMessages({
  userId,
  chatId,
  maxTokens,
  offset = 0,
  mustStartWithUserMessage = false
}: {
  userId: string;
  chatId: string;
  maxTokens: number;
  offset?: number;
  mustStartWithUserMessage?: boolean;
}) {
  let messages = await db.query.messages.findMany({
    where: (messages, { and, eq, or, isNull, ne }) =>
      and(
        eq(messages.userId, userId),
        eq(messages.chatId, chatId),
        eq(messages.regenerated, false),
        or(isNull(messages.finishReason), ne(messages.finishReason, 'error'))
      ),
    orderBy: (messages, { desc }) => desc(messages.createdAt),
    limit: messageChunkSize,
    offset
  });

  let totalTokens = 0;
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    totalTokens += numTokensFromString({
      text: JSON.stringify(message, null, 2)
    });
    if (totalTokens >= maxTokens) {
      messages = messages.slice(0, i);
    }
  }

  // Check if there are more messages to fetch
  if (totalTokens < maxTokens && messages.length === messageChunkSize) {
    messages = messages.concat(
      await getValidMessages({
        userId,
        chatId,
        maxTokens: maxTokens - totalTokens,
        offset: offset + messageChunkSize,
        mustStartWithUserMessage
      })
    );
  }

  messages = messages.toReversed();

  if (mustStartWithUserMessage) {
    const firstUserMessageIdx = messages.findIndex((m) => m.role === 'user');
    if (firstUserMessageIdx === -1) {
      throw new Error('No user message found');
    }
    messages = messages.slice(firstUserMessageIdx);
  }

  return messages;
}
