import { aiResponses, userMessages } from '@revelationsai/core/database/schema';
import type { RAIChatMessage } from '@revelationsai/core/model/chat/message';
import { nanoid } from 'ai';
import { and, desc, eq, isNull, or, type SQL } from 'drizzle-orm';
import { v4 as uuidV4 } from 'uuid';
import { db } from '../../lib/database';

export async function getChatMessages(
  chatId: string,
  options: {
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>[];
  } = {}
) {
  const { limit = 25, offset = 0, orderBy = [desc(aiResponses.createdAt)] } = options;

  const queryResult = await db
    .select()
    .from(userMessages)
    .leftJoin(aiResponses, eq(userMessages.id, aiResponses.userMessageId))
    .where(
      and(
        eq(aiResponses.chatId, chatId),
        or(eq(aiResponses.failed, false), isNull(aiResponses.failed)),
        or(eq(aiResponses.regenerated, false), isNull(aiResponses.regenerated))
      )
    )
    .offset(offset)
    .orderBy(...orderBy)
    .limit(limit);

  const messages: RAIChatMessage[] = [];

  for (const row of queryResult) {
    if (row.ai_responses) {
      messages.push({
        role: 'assistant',
        id: row.ai_responses.aiId ?? row.ai_responses.id,
        uuid: row.ai_responses.id,
        content: row.ai_responses.text!,
        createdAt: row.ai_responses.createdAt,
        modelId: row.ai_responses.modelId,
        searchQueries: row.ai_responses.searchQueries
      });
    } else {
      messages.push({
        role: 'assistant',
        id: nanoid(),
        uuid: uuidV4(),
        content: 'Failed.',
        createdAt: new Date()
      });
    }

    messages.push({
      role: 'user',
      id: row.user_messages.aiId ?? row.user_messages.id,
      uuid: row.user_messages.id,
      content: row.user_messages.text!,
      createdAt: row.user_messages.createdAt
    });
  }

  return messages;
}
