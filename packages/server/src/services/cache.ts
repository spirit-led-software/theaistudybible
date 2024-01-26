import upstashRedisConfig from '@revelationsai/core/configs/upstash-redis';
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
  name: string;
  value: string | null | undefined;
  type?: 'string' | 'list' | 'set';
};

export type CacheKeysInputFn<T> = (obj: T) => CacheKeyInput[];

/**
 * Represents the input type for cache keys in the cache service.
 * It can be an array of CacheKeyInput objects or a function that returns an array of CacheKeyInput objects.
 * @template T The type of the object used to generate cache keys.
 */
export type CacheKeysInput<T> = CacheKeyInput[] | CacheKeysInputFn<T>;

/**
 * Represents a cache key.
 */
export type CacheKey = {
  name: string;
  value: string;
  type?: 'string' | 'list' | 'set';
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

  const cacheKey = `${collection}:${key.name}:${key.value}`;
  try {
    const cachedValue = await cache.get(cacheKey);
    if (cachedValue) {
      console.log('CACHE HIT', cacheKey);
      if (typeof cachedValue === 'string') {
        return JSON.parse(cachedValue) as T;
      } else {
        return cachedValue as T;
      }
    }
    console.log('CACHE MISS', cacheKey);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error getting data from cache: ${error.message}\n${error.stack}`);
    } else {
      console.error(`Error getting data from cache: ${JSON.stringify(error)}`);
    }
  }

  const newValue = await fn();

  if (newValue) {
    try {
      await cache.set(cacheKey, JSON.stringify(newValue), {
        ex: expireSeconds
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error caching data: ${error.message}\n${error.stack}`);
      } else {
        console.error(`Error caching data: ${JSON.stringify(error)}`);
      }
    }
  }

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
  invalidateIterables?: boolean;
}) {
  const {
    collection,
    keys,
    fn,
    expireSeconds = DEFAULT_EXPIRE_SECONDS,
    invalidateIterables = false
  } = options;

  if (!cache) {
    return fn();
  }

  const obj = await fn();

  try {
    await Promise.all(
      filterKeys({ obj, keys }).map(async (key) => {
        const { name, value, type } = key;
        const cacheKey = `${collection}:${name}:${value}`;
        if (type === 'list') {
          if (invalidateIterables) {
            await cache.del(cacheKey);
          } else {
            await cache.lpush(cacheKey, JSON.stringify(obj));
            await cache.expire(cacheKey, expireSeconds);
          }
        } else if (type === 'set') {
          if (invalidateIterables) {
            await cache.del(cacheKey);
          } else {
            await cache.sadd(cacheKey, JSON.stringify(obj));
            await cache.expire(cacheKey, expireSeconds);
          }
        } else {
          await cache.set(cacheKey, JSON.stringify(obj), {
            ex: expireSeconds
          });
        }
      })
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error caching data: ${error.message}\n${error.stack}`);
    } else {
      console.error(`Error caching data: ${JSON.stringify(error)}`);
    }
  }

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

  try {
    const cacheKeysToDelete = filterKeys({ obj, keys }).map((key) => {
      return `${collection}:${key.name}:${key.value}`;
    });
    await cache.del(...cacheKeysToDelete);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error deleting data from cache: ${error.message}\n${error.stack}`);
    } else {
      console.error(`Error deleting data from cache: ${JSON.stringify(error)}`);
    }
  }

  return obj;
}

export async function cacheInvalidate(options: { collection: string; key: CacheKey }) {
  const { collection, key } = options;

  if (!cache) {
    return;
  }

  try {
    const cacheKey = `${collection}:${key.name}:${key.value}`;
    await cache.del(cacheKey);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error invalidating cache: ${error.message}\n${error.stack}`);
    } else {
      console.error(`Error invalidating cache: ${JSON.stringify(error)}`);
    }
  }
}

/**
 * Clears the cache.
 * @returns {Promise<void>} A promise that resolves when the cache is cleared.
 */
export async function clearCache() {
  if (!cache) {
    return 'SKIPPED';
  }
  return await cache.flushdb();
}

/**
 * Filters the keys of an object or array based on the provided options.
 * @param options - The options for filtering the keys.
 * @returns An array of filtered cache keys.
 */
function filterKeys<T>(options: { obj: T; keys: CacheKeysInput<T> }) {
  const { obj, keys } = options;
  if (Array.isArray(keys)) {
    return keys.filter((key) => key.value) as CacheKey[];
  } else {
    return keys(obj).filter((key) => key.value) as CacheKey[];
  }
}
