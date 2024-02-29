import { aiResponseReactions, aiResponses, users } from '@revelationsai/core/database/schema';
import {
  createAiResponseReactionSchema,
  type AiResponseReaction,
  type CreateAiResponseReactionData,
  type UpdateAiResponseReactionData
} from '@revelationsai/core/model/ai-response/reaction';
import { and, desc, eq, type SQL } from 'drizzle-orm';
import { db } from '../../lib/database';
import { cacheDelete, cacheGet, cacheUpsert, type CacheKeysInputFn } from '../../services/cache';

export const AI_RESPONSE_REACTIONS_CACHE_COLLECTION = 'aiResponseReactions';
export const defaultCacheKeysFn: CacheKeysInputFn<AiResponseReaction> = (reaction) => [
  { name: 'id', value: reaction.id },
  { name: 'aiResponseId', value: reaction.aiResponseId, type: 'set' },
  { name: 'aiResponseId_count', value: reaction.aiResponseId },
  {
    name: 'aiResponseId_reactionType',
    value: `${reaction.aiResponseId}_${reaction.reaction}`,
    type: 'set'
  },
  {
    name: 'aiResponseId_reactionType_count',
    value: `${reaction.aiResponseId}_${reaction.reaction}`
  }
];

export async function getAiResponseReactions(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(aiResponseReactions.createdAt) } = options;

  return await db
    .select()
    .from(aiResponseReactions)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getAiResponseReactionsWithInfo(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(aiResponseReactions.createdAt) } = options;

  return await db
    .select()
    .from(aiResponseReactions)
    .innerJoin(users, eq(aiResponseReactions.userId, users.id))
    .innerJoin(aiResponses, eq(aiResponseReactions.aiResponseId, aiResponses.id))
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getAiResponseReaction(id: string) {
  return await cacheGet({
    collection: AI_RESPONSE_REACTIONS_CACHE_COLLECTION,
    key: { name: 'id', value: id },
    fn: async () =>
      (await db.select().from(aiResponseReactions).where(eq(aiResponseReactions.id, id))).at(0)
  });
}

export async function getAiResponseReactionOrThrow(id: string) {
  const aiResponseImage = await getAiResponseReaction(id);
  if (!aiResponseImage) {
    throw new Error(`AiResponseReaction with id ${id} not found`);
  }
  return aiResponseImage;
}

export async function getAiResponseReactionsByAiResponseId(aiResponseId: string) {
  return await cacheGet({
    collection: AI_RESPONSE_REACTIONS_CACHE_COLLECTION,
    key: { name: 'aiResponseId', value: aiResponseId, type: 'set' },
    fn: async () =>
      await db
        .select()
        .from(aiResponseReactions)
        .where(eq(aiResponseReactions.aiResponseId, aiResponseId))
  });
}

export async function getAiResponseReactionCountByAiResponseIdAndReactionType(
  aiResponseId: string,
  reactionType: (typeof aiResponseReactions.reaction.enumValues)[number]
) {
  return await cacheGet({
    collection: AI_RESPONSE_REACTIONS_CACHE_COLLECTION,
    key: { name: 'aiResponseId_reactionType_count', value: `${aiResponseId}_${reactionType}` },
    fn: async () =>
      (
        await db
          .select()
          .from(aiResponseReactions)
          .where(
            and(
              eq(aiResponseReactions.aiResponseId, aiResponseId),
              eq(aiResponseReactions.reaction, reactionType)
            )
          )
      ).length
  });
}

export async function getAiResponseReactionCounts(aiResponseId: string) {
  return await cacheGet({
    collection: AI_RESPONSE_REACTIONS_CACHE_COLLECTION,
    key: { name: 'aiResponseId_count', value: aiResponseId },
    fn: async () => {
      const devoReactionCounts: {
        [key in (typeof aiResponseReactions.reaction.enumValues)[number]]?: number;
      } = {};
      for (const reactionType of aiResponseReactions.reaction.enumValues) {
        const reactionCount = await getAiResponseReactionCountByAiResponseIdAndReactionType(
          aiResponseId,
          reactionType
        );
        devoReactionCounts[reactionType] = reactionCount!;
      }
      return devoReactionCounts;
    }
  });
}

export async function createAiResponseReaction(data: CreateAiResponseReactionData) {
  const zodResult = await createAiResponseReactionSchema.safeParse(data);
  if (!zodResult.success) {
    throw new Error(
      `Invalid create AI response reaction data:\n\t${zodResult.error.errors.join('\n\t')}`
    );
  }

  return await cacheUpsert({
    collection: AI_RESPONSE_REACTIONS_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .insert(aiResponseReactions)
          .values({
            ...zodResult.data,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning()
      )[0]
  });
}

export async function updateAiResponseReaction(id: string, data: UpdateAiResponseReactionData) {
  const zodResult = await createAiResponseReactionSchema.safeParse(data);
  if (!zodResult.success) {
    throw new Error(
      `Invalid update AI response reaction data:\n\t${zodResult.error.errors.join('\n\t')}`
    );
  }

  return await cacheUpsert({
    collection: AI_RESPONSE_REACTIONS_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .update(aiResponseReactions)
          .set({
            ...zodResult.data,
            createdAt: undefined,
            updatedAt: new Date()
          })
          .where(eq(aiResponseReactions.id, id))
          .returning()
      )[0],
    invalidateIterables: true
  });
}

export async function deleteAiResponseReaction(id: string) {
  return await cacheDelete({
    collection: AI_RESPONSE_REACTIONS_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (await db.delete(aiResponseReactions).where(eq(aiResponseReactions.id, id)).returning())[0]
  });
}
