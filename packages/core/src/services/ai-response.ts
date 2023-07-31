import { SQL, desc, eq } from "drizzle-orm";
import { db } from "../database";
import {
  AiResponse,
  CreateAiResponseData,
  SourceDocument,
  UpdateAiResponseData,
} from "../database/model";
import {
  aiResponses,
  aiResponsesToSourceDocuments,
  sourceDocuments,
} from "../database/schema";

export async function getAiResponses(
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
    orderBy = desc(aiResponses.createdAt),
  } = options;

  return await db
    .select()
    .from(aiResponses)
    .where(where)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
}

export async function getAiResponse(id: string) {
  return (await db.select().from(aiResponses).where(eq(aiResponses.id, id))).at(
    0
  );
}

export async function getAiResponseOrThrow(id: string) {
  const aiResponse = await getAiResponse(id);
  if (!aiResponse) {
    throw new Error(`AiResponse with id ${id} not found`);
  }
  return aiResponse;
}

export async function getAiResponsesByUserMessageId(userMessageId: string) {
  return await db
    .select()
    .from(aiResponses)
    .where(eq(aiResponses.userMessageId, userMessageId))
    .orderBy(desc(aiResponses.createdAt));
}

export async function getAiResponseRelatedSourceDocuments(
  aiResponse: AiResponse
) {
  const sourceDocumentIds = (
    await db
      .select()
      .from(aiResponsesToSourceDocuments)
      .where(eq(aiResponsesToSourceDocuments.aiResponseId, aiResponse.id))
  ).map((d) => d.sourceDocumentId);

  const foundSourceDocuments: SourceDocument[] = [];
  for (const sourceDocumentId of sourceDocumentIds) {
    const sourceDocument = (
      await db
        .select()
        .from(sourceDocuments)
        .where(eq(sourceDocuments.id, sourceDocumentId))
    )[0];
    foundSourceDocuments.push(sourceDocument);
  }

  return foundSourceDocuments;
}

export async function createAiResponse(data: CreateAiResponseData) {
  return (await db.insert(aiResponses).values(data).returning())[0];
}

export async function updateAiResponse(id: string, data: UpdateAiResponseData) {
  return (
    await db
      .update(aiResponses)
      .set(data)
      .where(eq(aiResponses.id, id))
      .returning()
  )[0];
}

export async function deleteAiResponse(id: string) {
  return (
    await db.delete(aiResponses).where(eq(aiResponses.id, id)).returning()
  )[0];
}
