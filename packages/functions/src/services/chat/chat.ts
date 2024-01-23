import type { CreateChatData, UpdateChatData } from '@core/model/chat';
import { aiResponses, chats, userMessages } from '@core/schema';
import { db } from '@lib/database/database';
import type { Message } from 'ai';
import { SQL, and, desc, eq, sql } from 'drizzle-orm';
import { v4 as uuidV4 } from 'uuid';

export type RAIChatMessage = Message & {
  uuid: string;
};

export async function getChats(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(chats.createdAt) } = options;

  return await db.select().from(chats).where(where).limit(limit).offset(offset).orderBy(orderBy);
}

export async function getChat(id: string) {
  return (await db.select().from(chats).where(eq(chats.id, id))).at(0);
}

export async function getChatOrThrow(id: string) {
  const chat = await getChat(id);
  if (!chat) {
    throw new Error(`Chat with id ${id} not found`);
  }
  return chat;
}

export async function createChat(data: CreateChatData) {
  return (
    await db
      .insert(chats)
      .values({
        customName: data.name && data.name != 'New Chat' ? true : false,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()
  )[0];
}

export async function updateChat(id: string, data: UpdateChatData) {
  return (
    await db
      .update(chats)
      .set({
        customName: sql`${chats.customName} OR ${
          data.name && data.name != 'New Chat' ? true : false
        }`,
        ...data,
        createdAt: undefined,
        updatedAt: new Date()
      })
      .where(eq(chats.id, id))
      .returning()
  )[0];
}

export async function deleteChat(id: string) {
  return (await db.delete(chats).where(eq(chats.id, id)).returning())[0];
}

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
