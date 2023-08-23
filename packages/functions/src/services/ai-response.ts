import {
  AiResponse,
  CreateAiResponseData,
  UpdateAiResponseData,
} from "@core/model";
import { aiResponses, aiResponsesToSourceDocuments } from "@core/schema";
import { readOnlyDatabase, readWriteDatabase } from "@lib/database";
import { SQL, desc, eq } from "drizzle-orm";
import { getDocumentVectorStore } from "./vector-db";

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

  return await readOnlyDatabase
    .select()
    .from(aiResponses)
    .where(where)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
}

export async function getAiResponse(id: string) {
  return (
    await readOnlyDatabase
      .select()
      .from(aiResponses)
      .where(eq(aiResponses.id, id))
  ).at(0);
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
  const sourceDocumentIds = (
    await readOnlyDatabase
      .select()
      .from(aiResponsesToSourceDocuments)
      .where(eq(aiResponsesToSourceDocuments.aiResponseId, aiResponse.id))
  ).map((d) => d.sourceDocumentId);

  const vectorStore = await getDocumentVectorStore();
  const foundSourceDocuments = await vectorStore.getDocumentsByIds(
    sourceDocumentIds
  );

  return foundSourceDocuments;
}

export async function createAiResponse(data: CreateAiResponseData) {
  return (
    await readWriteDatabase.insert(aiResponses).values(data).returning()
  )[0];
}

export async function updateAiResponse(id: string, data: UpdateAiResponseData) {
  return (
    await readWriteDatabase
      .update(aiResponses)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(aiResponses.id, id))
      .returning()
  )[0];
}

export async function deleteAiResponse(id: string) {
  return (
    await readWriteDatabase
      .delete(aiResponses)
      .where(eq(aiResponses.id, id))
      .returning()
  )[0];
}
