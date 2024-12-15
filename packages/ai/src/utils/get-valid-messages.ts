import { db } from '@/core/database';
import { numTokensFromString } from './num-tokens-from-string';

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
