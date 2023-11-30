import type { AiResponse, CreateAiResponseData, UpdateAiResponseData } from '@core/model';
import { aiResponses, aiResponsesToSourceDocuments } from '@core/schema';
import { readOnlyDatabase, readWriteDatabase } from '@lib/database';
import { SQL, asc, desc, eq } from 'drizzle-orm';
import { getDocumentVectorStore } from '../vector-db';

export async function getAiResponses(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(aiResponses.createdAt) } = options;

  return await readOnlyDatabase
    .select()
    .from(aiResponses)
    .where(where)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
}

export async function getAiResponse(id: string) {
  return (await readOnlyDatabase.select().from(aiResponses).where(eq(aiResponses.id, id))).at(0);
}

export async function getAiResponseOrThrow(id: string) {
  const aiResponse = await getAiResponse(id);
  if (!aiResponse) {
    throw new Error(`AiResponse with id ${id} not found`);
  }
  return aiResponse;
}

export async function getAiResponsesByUserMessageId(userMessageId: string) {
  return await readOnlyDatabase
    .select()
    .from(aiResponses)
    .where(eq(aiResponses.userMessageId, userMessageId))
    .orderBy(desc(aiResponses.createdAt));
}

export async function getAiResponseSourceDocuments(aiResponse: AiResponse) {
  const sourceDocumentRelationships = await readOnlyDatabase
    .select()
    .from(aiResponsesToSourceDocuments)
    .where(eq(aiResponsesToSourceDocuments.aiResponseId, aiResponse.id))
    .orderBy(asc(aiResponsesToSourceDocuments.distance));

  const vectorStore = await getDocumentVectorStore();
  const foundSourceDocuments = await vectorStore.getDocumentsByIds(
    sourceDocumentRelationships.map((r) => r.sourceDocumentId)
  );

  return foundSourceDocuments.map((d) => {
    const relationship = sourceDocumentRelationships.find((r) => r.sourceDocumentId === d.id);
    return {
      ...d,
      distance: relationship?.distance ?? 0,
      distanceMetric: relationship?.distanceMetric ?? 'cosine'
    };
  });
}

export async function createAiResponse(data: CreateAiResponseData) {
  return (
    await readWriteDatabase
      .insert(aiResponses)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()
  )[0];
}

export async function updateAiResponse(id: string, data: UpdateAiResponseData) {
  return (
    await readWriteDatabase
      .update(aiResponses)
      .set({
        ...data,
        createdAt: undefined,
        updatedAt: new Date()
      })
      .where(eq(aiResponses.id, id))
      .returning()
  )[0];
}

export async function deleteAiResponse(id: string) {
  return (await readWriteDatabase.delete(aiResponses).where(eq(aiResponses.id, id)).returning())[0];
}
