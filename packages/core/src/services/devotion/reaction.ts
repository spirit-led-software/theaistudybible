import { SQL, and, desc, eq } from "drizzle-orm";
import { readDatabase, writeDatabase } from "../../database";
import {
  CreateDevotionReactionData,
  UpdateDevotionReactionData,
} from "../../database/model/devotion";
import { devotionReactions } from "../../database/schema";

export async function getDevotionReactions(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const {
    where,
    limit = 25,
    offset = 0,
    orderBy = desc(devotionReactions.createdAt),
  } = options;

  return await readDatabase
    .select()
    .from(devotionReactions)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getDevotionReaction(id: string) {
  return (
    await readDatabase
      .select()
      .from(devotionReactions)
      .where(eq(devotionReactions.id, id))
  ).at(0);
}

export async function getDevotionReactionOrThrow(id: string) {
  const devotionImage = await getDevotionReaction(id);
  if (!devotionImage) {
    throw new Error(`DevotionReaction with id ${id} not found`);
  }
  return devotionImage;
}

export async function getDevotionReactionsByDevotionId(devotionId: string) {
  return await readDatabase
    .select()
    .from(devotionReactions)
    .where(eq(devotionReactions.devotionId, devotionId));
}

export async function getDevotionReactionCountByDevotionIdAndReactionType(
  devotionId: string,
  reactionType: (typeof devotionReactions.reaction.enumValues)[number]
) {
  return (
    await readDatabase
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
  let devoReactionCounts:
    | {
        [key in (typeof devotionReactions.reaction.enumValues)[number]]?: number;
      } = {};
  for (const reactionType of devotionReactions.reaction.enumValues) {
    const reactionCount =
      await getDevotionReactionCountByDevotionIdAndReactionType(
        devotionId,
        reactionType
      );
    devoReactionCounts[reactionType] = reactionCount;
  }
  return devoReactionCounts;
}

export async function createDevotionReaction(data: CreateDevotionReactionData) {
  return (
    await writeDatabase.insert(devotionReactions).values(data).returning()
  )[0];
}

export async function updateDevotionReaction(
  id: string,
  data: UpdateDevotionReactionData
) {
  return (
    await writeDatabase
      .update(devotionReactions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(devotionReactions.id, id))
      .returning()
  )[0];
}

export async function deleteDevotionReaction(id: string) {
  return (
    await writeDatabase
      .delete(devotionReactions)
      .where(eq(devotionReactions.id, id))
      .returning()
  )[0];
}
