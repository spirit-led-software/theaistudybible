import { advancedChatModels, basicChatModels } from '@/ai/models';
import { numTokensFromString } from '@/ai/utils';
import { db } from '@/core/database';
import type { Context } from 'hono';
import type { Bindings } from 'hono/types';
import { Resource } from 'sst';
import type { Variables } from '../types';

export function validateModelId({
  c,
  providedModelId,
}: {
  c: Context<{
    Bindings: Bindings;
    Variables: Variables;
  }>;
  providedModelId: string;
}): Response | undefined {
  const isBasicTier = basicChatModels.some(
    (model) => `${model.host}:${model.id}` === providedModelId,
  );
  const isAdvancedTier = advancedChatModels.some(
    (model) => `${model.host}:${model.id}` === providedModelId,
  );
  if (!isBasicTier && !isAdvancedTier) {
    console.log('Invalid modelId provided');
    c.json(
      {
        message: 'Invalid model ID provided',
      },
      400,
    );
  }
  if (isAdvancedTier && !c.var.roles?.some((role) => role.id === 'admin')) {
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

export function getDefaultModelId(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
  return c.var.roles?.some((role) => role.id === 'admin')
    ? Resource.Stage.value === 'production'
      ? `${advancedChatModels[0].host}:${advancedChatModels[0].id}`
      : `${basicChatModels[0].host}:${basicChatModels[0].id}`
    : `${basicChatModels[0].host}:${basicChatModels[0].id}`;
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
    where: (messages, { and, eq, or, isNull, ne, not }) =>
      and(
        eq(messages.userId, userId),
        eq(messages.chatId, chatId),
        not(messages.regenerated),
        or(isNull(messages.finishReason), ne(messages.finishReason, 'error')),
      ),
    orderBy: (messages, { desc }) => desc(messages.createdAt),
    limit: messageChunkSize,
    offset,
  });

  let totalTokens = 0;
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    totalTokens += numTokensFromString({ text: JSON.stringify(message) });
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
