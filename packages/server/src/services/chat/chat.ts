import { chats } from '@revelationsai/core/database/schema';
import {
  createChatSchema,
  updateChatSchema,
  type Chat,
  type CreateChatData,
  type UpdateChatData
} from '@revelationsai/core/model/chat';
import { desc, eq, sql, type SQL } from 'drizzle-orm';
import { db } from '../../lib/database';
import { cacheDelete, cacheGet, cacheUpsert, type CacheKeysInput } from '../../services/cache';

export const CHATS_CACHE_COLLECTION = 'chats';
export const defaultCacheKeysFn: CacheKeysInput<Chat> = (chat) => [
  { name: 'id', value: chat.id },
  { name: 'userId', value: chat.userId }
];

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
  return await cacheGet({
    collection: CHATS_CACHE_COLLECTION,
    key: { name: 'id', value: id },
    fn: async () => (await db.select().from(chats).where(eq(chats.id, id))).at(0)
  });
}

export async function getChatOrThrow(id: string) {
  const chat = await getChat(id);
  if (!chat) {
    throw new Error(`Chat with id ${id} not found`);
  }
  return chat;
}

export async function getChatsByUserId(userId: string) {
  return await cacheGet({
    collection: CHATS_CACHE_COLLECTION,
    key: { name: 'userId', value: userId },
    fn: async () => await db.select().from(chats).where(eq(chats.userId, userId))
  });
}

export async function createChat(data: CreateChatData) {
  const zodResult = createChatSchema.safeParse(data);
  if (!zodResult.success) {
    throw new Error(`Invalid data for creating chat:\n\t${zodResult.error.issues.join('\n\t')}`);
  }

  return await cacheUpsert({
    collection: CHATS_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .insert(chats)
          .values({
            customName: data.name && data.name != 'New Chat' ? true : false,
            ...zodResult.data,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning()
      )[0]
  });
}

export async function updateChat(id: string, data: UpdateChatData) {
  const zodResult = updateChatSchema.safeParse(data);
  if (!zodResult.success) {
    throw new Error(`Invalid data for updating chat:\n\t${zodResult.error.issues.join('\n\t')}`);
  }

  return await cacheUpsert({
    collection: CHATS_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .update(chats)
          .set({
            customName: sql`${chats.customName} OR ${
              data.name && data.name != 'New Chat' ? true : false
            }`,
            ...zodResult.data,
            createdAt: undefined,
            updatedAt: new Date()
          })
          .where(eq(chats.id, id))
          .returning()
      )[0],
    invalidateIterables: true
  });
}

export async function deleteChat(id: string) {
  return await cacheDelete({
    collection: CHATS_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () => (await db.delete(chats).where(eq(chats.id, id)).returning())[0]
  });
}
