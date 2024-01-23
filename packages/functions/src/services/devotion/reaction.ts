import type {
  CreateDevotionReactionData,
  UpdateDevotionReactionData
} from '@core/model/devotion/reaction';
import { devotionReactions, devotions, users } from '@core/schema';
import { db } from '@lib/database/database';
import { SQL, and, desc, eq } from 'drizzle-orm';

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
  return (await db.select().from(devotionReactions).where(eq(devotionReactions.id, id))).at(0);
}

export async function getDevotionReactionOrThrow(id: string) {
  const devotionImage = await getDevotionReaction(id);
  if (!devotionImage) {
    throw new Error(`DevotionReaction with id ${id} not found`);
  }
  return devotionImage;
}

export async function getDevotionReactionsByDevotionId(devotionId: string) {
  return await db
    .select()
    .from(devotionReactions)
    .where(eq(devotionReactions.devotionId, devotionId));
}

export async function getDevotionReactionCountByDevotionIdAndReactionType(
  devotionId: string,
  reactionType: (typeof devotionReactions.reaction.enumValues)[number]
) {
  return (
    await db
      .select()
      .from(devotionReactions)
      .where(
        and(
          eq(devotionReactions.devotionId, devotionId),
          eq(devotionReactions.reaction, reactionType)
        )
      )
  ).length;
}

export async function getDevotionReactionCounts(devotionId: string) {
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
}

export async function createDevotionReaction(data: CreateDevotionReactionData) {
  return (
    await db
      .insert(devotionReactions)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()
  )[0];
}

export async function updateDevotionReaction(id: string, data: UpdateDevotionReactionData) {
  return (
    await db
      .update(devotionReactions)
      .set({
        ...data,
        createdAt: undefined,
        updatedAt: new Date()
      })
      .where(eq(devotionReactions.id, id))
      .returning()
  )[0];
}

export async function deleteDevotionReaction(id: string) {
  return (await db.delete(devotionReactions).where(eq(devotionReactions.id, id)).returning())[0];
}
