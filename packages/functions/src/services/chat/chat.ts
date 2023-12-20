import type { CreateChatData, UpdateChatData } from '@core/model/chat';
import { chats } from '@core/schema';
import { readOnlyDatabase, readWriteDatabase } from '@lib/database';
import type { Message } from 'ai';
import { SQL, desc, eq, sql } from 'drizzle-orm';

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

  return await readOnlyDatabase
    .select()
    .from(chats)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getChat(id: string) {
  return (await readOnlyDatabase.select().from(chats).where(eq(chats.id, id))).at(0);
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
    await readWriteDatabase
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
    await readWriteDatabase
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
  return (await readWriteDatabase.delete(chats).where(eq(chats.id, id)).returning())[0];
}
