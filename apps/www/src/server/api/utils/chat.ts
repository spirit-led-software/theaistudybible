import { freeTierModels, plusTierModels } from '@/ai/models';
import { numTokensFromString } from '@/ai/utils';
import { db } from '@/core/database';
import { hasRole } from '@/core/utils/user';
import type { JwtPayload, Variables } from '@clerk/types';
import type { Context } from 'hono';
import type { Bindings } from 'hono/types';
import { Resource } from 'sst';

export function validateModelId({
  c,
  providedModelId,
  claims,
}: {
  c: Context<{
    Bindings: Bindings;
    Variables: Variables;
  }>;
  providedModelId: string;
  claims: JwtPayload;
}): Response | undefined {
  const isFreeTier = freeTierModels.some(
    (model) => `${model.provider}:${model.id}` === providedModelId,
  );
  const isPlusTier = plusTierModels.some(
    (model) => `${model.provider}:${model.id}` === providedModelId,
  );
  if (!isFreeTier && !isPlusTier) {
    console.log('Invalid modelId provided');
    c.json(
      {
        message: 'Invalid model ID provided',
      },
      400,
    );
  }
  if (isPlusTier && !hasRole('rc:plus', claims) && !hasRole('admin', claims)) {
    return c.json(
      {
        message:
          'Your plan does not support this model. Please upgrade to a plan that supports this model.',
      },
      403,
    );
  }
  return undefined;
}

export function getDefaultModelId(claims: JwtPayload) {
  return hasRole('rc:plus', claims) || hasRole('admin', claims)
    ? Resource.Stage.value === 'production'
      ? `${plusTierModels[0].provider}:${plusTierModels[0].id}`
      : `${freeTierModels[0].provider}:${freeTierModels[0].id}`
    : `${freeTierModels[0].provider}:${freeTierModels[0].id}`;
}

const messageChunkSize = 10;
export async function getValidMessages({
  userId,
  chatId,
  maxTokens,
  offset = 0,
  mustStartWithUserMessage = false,
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
        or(isNull(messages.finishReason), ne(messages.finishReason, 'error')),
      ),
    orderBy: (messages, { desc }) => desc(messages.createdAt),
    limit: messageChunkSize,
    offset,
  });

  let totalTokens = 0;
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    totalTokens += numTokensFromString({
      text: JSON.stringify(message, null, 2),
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
        mustStartWithUserMessage,
      }),
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
