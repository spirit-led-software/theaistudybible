import type {
  CreateDevotionReactionData,
  DevotionReaction,
  UpdateDevotionReactionData
} from '@core/model/devotion/reaction';
import { devotionReactions, devotions, users } from '@core/schema';
import { db } from '@lib/database/database';
import { cacheDelete, cacheGet, cacheUpsert, type CacheKeysInputFn } from '@services/cache';
import { SQL, and, desc, eq } from 'drizzle-orm';

export const DEVOTION_REACTIONS_CACHE_COLLECTION = 'devotionReactions';
export const defaultCacheKeysFn: CacheKeysInputFn<DevotionReaction> = (reaction) => [
  { name: 'id', value: reaction.id },
  { name: 'devotionId', value: reaction.devotionId, type: 'set' },
  { name: 'devotionId_count', value: reaction.devotionId },
  {
    name: 'devotionId_reactionType',
    value: `${reaction.devotionId}_${reaction.reaction}`,
    type: 'set'
  },
  {
    name: 'devotionId_reactionType_count',
    value: `${reaction.devotionId}_${reaction.reaction}`
  }
];
export const DEVOTIONS_CACHE_TTL_SECONDS = 60 * 60 * 24; // 1 day

export async function getDevotionReactions(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(devotionReactions.createdAt) } = options;

  return await db
    .select()
    .from(devotionReactions)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getDevotionReactionsWithInfo(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(devotionReactions.createdAt) } = options;

  return await db
    .select()
    .from(devotionReactions)
    .innerJoin(users, eq(devotionReactions.userId, users.id))
    .innerJoin(devotions, eq(devotionReactions.devotionId, devotions.id))
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getDevotionReaction(id: string) {
  return await cacheGet({
    collection: DEVOTION_REACTIONS_CACHE_COLLECTION,
    key: { name: 'id', value: id },
    fn: async () =>
      (await db.select().from(devotionReactions).where(eq(devotionReactions.id, id))).at(0),
    expireSeconds: DEVOTIONS_CACHE_TTL_SECONDS
  });
}

export async function getDevotionReactionOrThrow(id: string) {
  const devotionImage = await getDevotionReaction(id);
  if (!devotionImage) {
    throw new Error(`DevotionReaction with id ${id} not found`);
  }
  return devotionImage;
}

export async function getDevotionReactionsByDevotionId(devotionId: string) {
  return await cacheGet({
    collection: DEVOTION_REACTIONS_CACHE_COLLECTION,
    key: { name: 'devotionId', value: devotionId, type: 'set' },
    fn: async () =>
      await db.select().from(devotionReactions).where(eq(devotionReactions.devotionId, devotionId)),
    expireSeconds: DEVOTIONS_CACHE_TTL_SECONDS
  });
}

export async function getDevotionReactionCountByDevotionIdAndReactionType(
  devotionId: string,
  reactionType: (typeof devotionReactions.reaction.enumValues)[number]
) {
  return await cacheGet({
    collection: DEVOTION_REACTIONS_CACHE_COLLECTION,
    key: { name: 'devotionId_reactionType_count', value: `${devotionId}_${reactionType}` },
    fn: async () =>
      (
        await db
          .select()
          .from(devotionReactions)
          .where(
            and(
              eq(devotionReactions.devotionId, devotionId),
              eq(devotionReactions.reaction, reactionType)
            )
          )
      ).length,
    expireSeconds: DEVOTIONS_CACHE_TTL_SECONDS
  });
}

export async function getDevotionReactionCounts(devotionId: string) {
  return await cacheGet({
    collection: DEVOTION_REACTIONS_CACHE_COLLECTION,
    key: { name: 'devotionId_count', value: devotionId },
    fn: async () => {
      const devoReactionCounts: {
        [key in (typeof devotionReactions.reaction.enumValues)[number]]?: number;
      } = {};
      for (const reactionType of devotionReactions.reaction.enumValues) {
        const reactionCount = await getDevotionReactionCountByDevotionIdAndReactionType(
          devotionId,
          reactionType
        );
        devoReactionCounts[reactionType] = reactionCount;
      }
      return devoReactionCounts;
    },
    expireSeconds: DEVOTIONS_CACHE_TTL_SECONDS
  });
}

export async function createDevotionReaction(data: CreateDevotionReactionData) {
  return await cacheUpsert({
    collection: DEVOTION_REACTIONS_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .insert(devotionReactions)
          .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning()
      )[0],
    expireSeconds: DEVOTIONS_CACHE_TTL_SECONDS
  });
}

export async function updateDevotionReaction(id: string, data: UpdateDevotionReactionData) {
  return await cacheUpsert({
    collection: DEVOTION_REACTIONS_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .update(devotionReactions)
          .set({
            ...data,
            createdAt: undefined,
            updatedAt: new Date()
          })
          .where(eq(devotionReactions.id, id))
          .returning()
      )[0],
    expireSeconds: DEVOTIONS_CACHE_TTL_SECONDS,
    invalidateIterables: true
  });
}

export async function deleteDevotionReaction(id: string) {
  return await cacheDelete({
    collection: DEVOTION_REACTIONS_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (await db.delete(devotionReactions).where(eq(devotionReactions.id, id)).returning())[0]
  });
}
