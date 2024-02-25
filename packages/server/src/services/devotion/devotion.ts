import { devotions } from '@revelationsai/core/database/schema';
import type {
  CreateDevotionData,
  Devotion,
  UpdateDevotionData
} from '@revelationsai/core/model/devotion';
import { desc, eq, sql, type SQL } from 'drizzle-orm';
import { db } from '../../lib/database';
import { cacheDelete, cacheGet, cacheUpsert, type CacheKeysInput } from '../../services/cache';

export const DEVOTIONS_CACHE_COLLECTION = 'devotions';
export const defaultCacheKeysFn: CacheKeysInput<Devotion> = (devotion) => [
  { name: 'id', value: devotion.id },
  { name: 'date', value: devotion.createdAt.toISOString().split('T')[0] }
];
export const DEVOTIONS_CACHE_TTL_SECONDS = 60 * 60 * 24; // 1 day

export async function getDevotions(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(devotions.createdAt) } = options;

  return await db
    .select()
    .from(devotions)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getDevotion(id: string) {
  return await cacheGet({
    collection: DEVOTIONS_CACHE_COLLECTION,
    key: { name: 'id', value: id },
    fn: async () => (await db.select().from(devotions).where(eq(devotions.id, id))).at(0),
    expireSeconds: DEVOTIONS_CACHE_TTL_SECONDS
  });
}

export async function getDevotionOrThrow(id: string) {
  const devotion = await getDevotion(id);
  if (!devotion) {
    throw new Error(`Devotion with id ${id} not found`);
  }
  return devotion;
}

/**
 * Get the devotion for the given date.
 *
 * @param dateString YYYY-MM-DD
 * @param includeFailed Whether to include failed devotions
 * @returns
 */
export async function getDevotionByCreatedDate(dateString: string, includeFailed = false) {
  return await cacheGet({
    collection: DEVOTIONS_CACHE_COLLECTION,
    key: { name: 'date', value: dateString },
    fn: async () =>
      (
        await db
          .select()
          .from(devotions)
          .where(
            sql`${devotions.createdAt}::date = ${dateString}::date AND ${devotions.failed} = ${includeFailed}`
          )
      ).at(0),
    expireSeconds: DEVOTIONS_CACHE_TTL_SECONDS
  });
}

export async function createDevotion(data: CreateDevotionData) {
  return await cacheUpsert({
    collection: DEVOTIONS_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .insert(devotions)
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

export async function updateDevotion(id: string, data: UpdateDevotionData) {
  return await cacheUpsert({
    collection: DEVOTIONS_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .update(devotions)
          .set({
            ...data,
            createdAt: undefined,
            updatedAt: new Date()
          })
          .where(eq(devotions.id, id))
          .returning()
      )[0],
    expireSeconds: DEVOTIONS_CACHE_TTL_SECONDS
  });
}

export async function deleteDevotion(id: string) {
  return await cacheDelete({
    collection: DEVOTIONS_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () => (await db.delete(devotions).where(eq(devotions.id, id)).returning())[0]
  });
}
