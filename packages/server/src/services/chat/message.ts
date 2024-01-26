import { aiResponses, userMessages } from '@revelationsai/core/database/schema';
import type { Message } from 'ai';
import { and, desc, eq, type SQL } from 'drizzle-orm';
import { v4 as uuidV4 } from 'uuid';
import { db } from '../../lib/database';

export type RAIChatMessage = Message & {
  uuid: string;
};

export async function getChatMessages(
  chatId: string,
  options: {
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { limit = 25, offset = 0, orderBy = desc(aiResponses.createdAt) } = options;

  const queryResult = await db
    .select()
    .from(userMessages)
    .leftJoin(aiResponses, eq(userMessages.id, aiResponses.userMessageId))
    .where(
      and(
        eq(aiResponses.chatId, chatId),
        eq(aiResponses.failed, false),
        eq(aiResponses.regenerated, false)
      )
    )
    .offset(offset)
    .orderBy(orderBy)
    .limit(limit);

  const messages: RAIChatMessage[] = [];

  for (const row of queryResult) {
    if (row.ai_responses) {
      messages.push({
        role: 'assistant',
        id: row.ai_responses.aiId ?? row.ai_responses.id,
        uuid: row.ai_responses.id,
        content: row.ai_responses.text!,
        createdAt: row.ai_responses.createdAt
      });
    } else {
      messages.push({
        role: 'assistant',
        id: uuidV4(),
        uuid: uuidV4(),
        content: 'Failed.',
        createdAt: new Date()
      });
    }

    messages.push({
      role: 'user',
      id: row.user_messages.id,
      uuid: row.user_messages.id,
      content: row.user_messages.text!,
      createdAt: row.user_messages.createdAt
    });
  }

  return messages;
}