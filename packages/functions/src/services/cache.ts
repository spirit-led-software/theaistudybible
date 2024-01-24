import upstashRedisConfig from '@core/configs/upstash-redis';
import { Redis } from '@upstash/redis';

/**
 * Redis cache instance.
 * @type {Redis | undefined}
 */
export const cache =
  upstashRedisConfig.url && upstashRedisConfig.token
    ? new Redis({
        url: upstashRedisConfig.url,
        token: upstashRedisConfig.token
      })
    : undefined;

const DEFAULT_EXPIRE_SECONDS = 60 * 60;

/**
 * Represents the input for a cache key.
 */
export type CacheKeyInput = {
  keyName: string;
  keyValue: string | null | undefined;
};

/**
 * Represents the input type for cache keys in the cache service.
 * It can be an array of CacheKeyInput objects or a function that returns an array of CacheKeyInput objects.
 * @template T The type of the object used to generate cache keys.
 */
export type CacheKeysInput<T> = CacheKeyInput[] | ((obj: T) => CacheKeyInput[]);

/**
 * Represents a cache key.
 */
export type CacheKey = {
  keyName: string;
  keyValue: string;
};

/**
 * Retrieves a value from the cache or the database if not found in the cache.
 * @param options - The options for retrieving the value from the cache.
 * @returns A promise that resolves to the retrieved value.
 */
export async function cacheGet<T>(options: {
  collection: string;
  key: CacheKey;
  fn: () => Promise<T>;
  expireSeconds?: number;
}) {
  const { collection, key, fn, expireSeconds = DEFAULT_EXPIRE_SECONDS } = options;

  if (!cache) {
    return fn();
  }

  const cacheKey = `${collection}:${key.keyName}:${key.keyValue}`;
  const cachedValue: string | null = await cache.get(cacheKey);
  if (cachedValue) {
    return JSON.parse(cachedValue) as Awaited<ReturnType<typeof fn>>;
  }

  const newValue = await fn();
  await cache.set(cacheKey, JSON.stringify(newValue), {
    ex: expireSeconds
  });
  return newValue;
}

/**
 * Upserts data into the cache.
 *
 * @param options - The options for cache upsert.
 * @param options.collection - The collection name.
 * @param options.keys - The cache keys.
 * @param options.fn - The function that retrieves the data to be cached.
 * @param options.expireSeconds - The expiration time in seconds for the cached data (optional).
 * @returns The cached data.
 */
export async function cacheUpsert<T>(options: {
  collection: string;
  keys: CacheKeysInput<T>;
  fn: () => Promise<T>;
  expireSeconds?: number;
}) {
  const { collection, keys, fn, expireSeconds = DEFAULT_EXPIRE_SECONDS } = options;

  if (!cache) {
    return fn();
  }

  const obj = await fn();

  await Promise.all(
    filterKeys({ obj, keys }).map(async (key) => {
      const cacheKey = `${collection}:${key.keyName}:${key.keyValue}`;
      await cache.set(cacheKey, JSON.stringify(obj), {
        ex: expireSeconds
      });
    })
  );

  return obj;
}

/**
 * Deletes data from the cache based on the specified keys and collection.
 *
 * @param options - The options for cache deletion.
 * @param options.collection - The collection name.
 * @param options.keys - The keys to identify the data in the cache.
 * @param options.fn - The function that retrieves the data from the database.
 * @returns The deleted data from the database.
 */
export async function cacheDelete<T>(options: {
  collection: string;
  keys: CacheKeysInput<T>;
  fn: () => Promise<T>;
}) {
  const { collection, keys, fn } = options;

  if (!cache) {
    return fn();
  }

  const obj = await fn();
  await Promise.all(
    filterKeys({ obj, keys }).map(async (key) => {
      const cacheKey = `${collection}:${key.keyName}:${key.keyValue}`;
      await cache.del(cacheKey);
    })
  );

  return obj;
}

/**
 * Clears the cache.
 * @returns {Promise<void>} A promise that resolves when the cache is cleared.
 */
export async function clearCache() {
  if (!cache) {
    return;
  }
  await cache.flushdb();
}

/**
 * Filters the keys of an object or array based on the provided options.
 * @param options - The options for filtering the keys.
 * @returns An array of filtered cache keys.
 */
function filterKeys<T>(options: { obj: T; keys: CacheKeysInput<T> }) {
  const { obj, keys } = options;
  if (Array.isArray(keys)) {
    return keys.filter((key) => key.keyValue) as CacheKey[];
  } else {
    return keys(obj).filter((key) => key) as CacheKey[];
  }
}
