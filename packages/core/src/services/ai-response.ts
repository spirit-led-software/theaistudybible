import { SQL, desc, eq } from "drizzle-orm";
import { db } from "../database";
import { CreateAiResponseData, UpdateAiResponseData } from "../database/model";
import { aiResponses } from "../database/schema";

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

  return await db.query.aiResponses.findMany({
    where,
    limit,
    offset,
    orderBy,
  });
}

export async function getAiResponse(id: string) {
  return await db.query.aiResponses.findFirst({
    where: eq(aiResponses.id, id),
    with: {
      sourceDocuments: true,
      userMessage: true,
    },
  });
}

export async function getAiResponseOrThrow(id: string) {
  const aiResponse = await getAiResponse(id);
  if (!aiResponse) {
    throw new Error(`AiResponse with id ${id} not found`);
  }
  return aiResponse;
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
