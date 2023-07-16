import { SQL, desc, eq } from "drizzle-orm";
import { db } from "../database";
import {
  CreateIndexOperationData,
  UpdateIndexOperationData,
} from "../database/model";
import { indexOperations } from "../database/schema/schema";

export async function getIndexOperations(
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
    orderBy = desc(indexOperations.createdAt),
  } = options;

  return await db.query.indexOperations.findMany({
    where,
    orderBy,
    limit,
    offset,
  });
}

export async function getIndexOperation(id: string) {
  return await db.query.indexOperations.findFirst({
    where: eq(indexOperations.id, id),
  });
}

export async function getIndexOperationOrThrow(id: string) {
  const indexOperation = await getIndexOperation(id);
  if (!indexOperation) {
    throw new Error(`IndexOperation with id ${id} not found`);
  }
  return indexOperation;
}

export async function createIndexOperation(data: CreateIndexOperationData) {
  return (await db.insert(indexOperations).values(data).returning())[0];
}

export async function updateIndexOperation(
  id: string,
  data: UpdateIndexOperationData
) {
  return (
    await db
      .update(indexOperations)
      .set(data)
      .where(eq(indexOperations.id, id))
      .returning()
  )[0];
}

export async function deleteIndexOperation(id: string) {
  return (
    await db
      .delete(indexOperations)
      .where(eq(indexOperations.id, id))
      .returning()
  )[0];
}
