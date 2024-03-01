import { aiResponses } from '@revelationsai/core/database/schema';
import {
  createAiResponseSchema,
  updateAiResponseSchema,
  type AiResponse,
  type CreateAiResponseData,
  type UpdateAiResponseData
} from '@revelationsai/core/model/ai-response';
import { desc, eq, type SQL } from 'drizzle-orm';
import { db } from '../../lib/database';
import { cacheDelete, cacheGet, cacheUpsert, type CacheKeysInput } from '../../services/cache';

export const AI_RESPONSES_CACHE_COLLECTION = 'aiResponses';
export const defaultCacheKeysFn: CacheKeysInput<AiResponse> = (aiResponse) => [
  { name: 'id', value: aiResponse.id },
  { name: 'userId', value: aiResponse.userId, type: 'set' },
  { name: 'chatId', value: aiResponse.chatId, type: 'set' },
  { name: 'userMessageId', value: aiResponse.userMessageId, type: 'set' }
];

export async function getAiResponses(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(aiResponses.createdAt) } = options;

  return await db
    .select()
    .from(aiResponses)
    .where(where)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
}

export async function getAiResponse(id: string) {
  return await cacheGet({
    collection: AI_RESPONSES_CACHE_COLLECTION,
    key: { name: 'id', value: id },
    fn: async () => (await db.select().from(aiResponses).where(eq(aiResponses.id, id))).at(0)
  });
}

export async function getAiResponseOrThrow(id: string) {
  const aiResponse = await getAiResponse(id);
  if (!aiResponse) {
    throw new Error(`AiResponse with id ${id} not found`);
  }
  return aiResponse;
}

export async function getAiResponsesByUserMessageId(userMessageId: string) {
  return await cacheGet({
    collection: AI_RESPONSES_CACHE_COLLECTION,
    key: { name: 'userMessageId', value: userMessageId, type: 'set' },
    fn: async () =>
      await db
        .select()
        .from(aiResponses)
        .where(eq(aiResponses.userMessageId, userMessageId))
        .orderBy(desc(aiResponses.createdAt))
  });
}

export async function createAiResponse(data: CreateAiResponseData) {
  return await cacheUpsert({
    collection: AI_RESPONSES_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .insert(aiResponses)
          .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning()
      )[0]
  });
}

export async function updateAiResponse(id: string, data: UpdateAiResponseData) {
  return await cacheUpsert({
    collection: AI_RESPONSES_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .update(aiResponses)
          .set({
            ...data,
            createdAt: undefined,
            updatedAt: new Date()
          })
          .where(eq(aiResponses.id, id))
          .returning()
      )[0],
    invalidateIterables: true
  });
}

export async function deleteAiResponse(id: string) {
  return await cacheDelete({
    collection: AI_RESPONSES_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () => (await db.delete(aiResponses).where(eq(aiResponses.id, id)).returning())[0]
  });
}
