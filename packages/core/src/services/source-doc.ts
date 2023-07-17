import { SQL, desc, eq } from "drizzle-orm";
import { db } from "../database";
import {
  CreateSourceDocumentData,
  UpdateSourceDocumentData,
} from "../database/model";
import { sourceDocuments } from "../database/schema";

export async function getSourceDocuments(
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
    orderBy = desc(sourceDocuments.createdAt),
  } = options;

  return await db
    .select()
    .from(sourceDocuments)
    .limit(limit)
    .offset(offset)
    .where(where)
    .orderBy(orderBy);
}

export async function getSourceDocument(id: string) {
  return (
    await db.select().from(sourceDocuments).where(eq(sourceDocuments.id, id))
  ).at(0);
}

export async function getSourceDocumentOrThrow(id: string) {
  const aiResponse = await getSourceDocument(id);
  if (!aiResponse) {
    throw new Error(`SourceDocument with id ${id} not found`);
  }
  return aiResponse;
}

export async function getSourceDocumentByText(text: string) {
  return (
    await db
      .select()
      .from(sourceDocuments)
      .where(eq(sourceDocuments.text, text))
  ).at(0);
}

export async function createSourceDocument(data: CreateSourceDocumentData) {
  return (await db.insert(sourceDocuments).values(data).returning())[0];
}

export async function updateSourceDocument(
  id: string,
  data: UpdateSourceDocumentData
) {
  return (
    await db
      .update(sourceDocuments)
      .set(data)
      .where(eq(sourceDocuments.id, id))
      .returning()
  )[0];
}

export async function deleteSourceDocument(id: string) {
  return (
    await db
      .delete(sourceDocuments)
      .where(eq(sourceDocuments.id, id))
      .returning()
  )[0];
}
