import type {
  CreateAiResponseReactionData,
  UpdateAiResponseReactionData
} from '@core/model/ai-response/reaction';
import { aiResponseReactions, aiResponses, users } from '@core/schema';
import { readOnlyDatabase, readWriteDatabase } from '@lib/database';
import { SQL, and, desc, eq } from 'drizzle-orm';

export async function getAiResponseReactions(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(aiResponseReactions.createdAt) } = options;

  return await readOnlyDatabase
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

  return await readOnlyDatabase
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
  return (
    await readOnlyDatabase.select().from(aiResponseReactions).where(eq(aiResponseReactions.id, id))
  ).at(0);
}

export async function getAiResponseReactionOrThrow(id: string) {
  const aiResponseImage = await getAiResponseReaction(id);
  if (!aiResponseImage) {
    throw new Error(`AiResponseReaction with id ${id} not found`);
  }
  return aiResponseImage;
}

export async function getAiResponseReactionsByAiResponseId(aiResponseId: string) {
  return await readOnlyDatabase
    .select()
    .from(aiResponseReactions)
    .where(eq(aiResponseReactions.aiResponseId, aiResponseId));
}

export async function getAiResponseReactionCountByAiResponseIdAndReactionType(
  aiResponseId: string,
  reactionType: (typeof aiResponseReactions.reaction.enumValues)[number]
) {
  return (
    await readOnlyDatabase
      .select()
      .from(aiResponseReactions)
      .where(
        and(
          eq(aiResponseReactions.aiResponseId, aiResponseId),
          eq(aiResponseReactions.reaction, reactionType)
        )
      )
  ).length;
}

export async function getAiResponseReactionCounts(aiResponseId: string) {
  const devoReactionCounts: {
    [key in (typeof aiResponseReactions.reaction.enumValues)[number]]?: number;
  } = {};
  for (const reactionType of aiResponseReactions.reaction.enumValues) {
    const reactionCount = await getAiResponseReactionCountByAiResponseIdAndReactionType(
      aiResponseId,
      reactionType
    );
    devoReactionCounts[reactionType] = reactionCount;
  }
  return devoReactionCounts;
}

export async function createAiResponseReaction(data: CreateAiResponseReactionData) {
  return (
    await readWriteDatabase
      .insert(aiResponseReactions)
      .values({
        ...data,
        createdAt: new Date(new Date().toUTCString()),
        updatedAt: new Date(new Date().toUTCString())
      })
      .returning()
  )[0];
}

export async function updateAiResponseReaction(id: string, data: UpdateAiResponseReactionData) {
  return (
    await readWriteDatabase
      .update(aiResponseReactions)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(aiResponseReactions.id, id))
      .returning()
  )[0];
}

export async function deleteAiResponseReaction(id: string) {
  return (
    await readWriteDatabase
      .delete(aiResponseReactions)
      .where(eq(aiResponseReactions.id, id))
      .returning()
  )[0];
}
