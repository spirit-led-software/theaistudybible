import { userMessages, users } from '@revelationsai/core/database/schema';
import type {
  CreateUserMessageData,
  UpdateUserMessageData,
  UserMessage
} from '@revelationsai/core/model/user/message';
import { SQL, and, desc, eq, like, not, sql } from 'drizzle-orm';
import { db } from '../../lib/database';
import { cacheDelete, cacheGet, cacheUpsert, type CacheKeysInput } from '../../services/cache';

export const USER_MESSAGES_CACHE_COLLECTION = 'userMessages';
export const defaultCacheKeysFn: CacheKeysInput<UserMessage> = (message) => [
  { name: 'id', value: message.id },
  { name: 'userId', value: message.userId, type: 'set' },
  { name: 'chatId', value: message.chatId, type: 'set' },
  { name: 'chatId_text', value: `${message.chatId}_${message.text}`, type: 'set' }
];

export async function getUserMessages(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(userMessages.createdAt) } = options;

  return await db
    .select()
    .from(userMessages)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getUserMessage(id: string) {
  return await cacheGet({
    collection: USER_MESSAGES_CACHE_COLLECTION,
    key: { name: 'id', value: id },
    fn: async () => (await db.select().from(userMessages).where(eq(userMessages.id, id))).at(0)
  });
}

export async function getUserMessageOrThrow(id: string) {
  const userMessage = await getUserMessage(id);
  if (!userMessage) {
    throw new Error(`UserMessage with id ${id} not found`);
  }
  return userMessage;
}

export async function getUserMessagesByChatId(chatId: string) {
  return await cacheGet({
    collection: USER_MESSAGES_CACHE_COLLECTION,
    key: { name: 'chatId', value: chatId, type: 'set' },
    fn: async () =>
      await db
        .select()
        .from(userMessages)
        .where(eq(userMessages.chatId, chatId))
        .orderBy(desc(userMessages.createdAt))
  });
}

export async function getUserMessagesByChatIdAndText(chatId: string, text: string) {
  return await cacheGet({
    collection: USER_MESSAGES_CACHE_COLLECTION,
    key: { name: 'chatId_text', value: `${chatId}_${text}`, type: 'set' },
    fn: async () =>
      await db
        .select()
        .from(userMessages)
        .where(and(eq(userMessages.chatId, chatId), eq(userMessages.text, text)))
        .orderBy(desc(userMessages.createdAt))
  });
}

export async function createUserMessage(data: CreateUserMessageData) {
  return await cacheUpsert({
    collection: USER_MESSAGES_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .insert(userMessages)
          .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning()
      )[0]
  });
}

export async function updateUserMessage(id: string, data: UpdateUserMessageData) {
  return await cacheUpsert({
    collection: USER_MESSAGES_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .update(userMessages)
          .set({
            ...data,
            createdAt: undefined,
            updatedAt: new Date()
          })
          .where(eq(userMessages.id, id))
          .returning()
      )[0],
    invalidateIterables: true
  });
}

export async function deleteUserMessage(id: string) {
  return await cacheDelete({
    collection: USER_MESSAGES_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () => (await db.delete(userMessages).where(eq(userMessages.id, id)).returning())[0]
  });
}

export async function getMostAskedUserMessages(count: number) {
  return await db
    .select({
      text: userMessages.text,
      count: sql`COUNT(*)`
    })
    .from(userMessages)
    .innerJoin(users, eq(userMessages.userId, users.id))
    .where(not(like(users.email, '%@revelationsai.com'))) // Exclude internal accounts
    .groupBy(userMessages.text)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(count);
}
