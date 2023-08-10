import { SQL, desc, eq } from "drizzle-orm";
import { readDatabase, writeDatabase } from "../database";
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

  return await readDatabase
    .select()
    .from(indexOperations)
    .limit(limit)
    .offset(offset)
    .where(where)
    .orderBy(orderBy);
}

export async function getIndexOperation(id: string) {
  return (
    await readDatabase
      .select()
      .from(indexOperations)
      .where(eq(indexOperations.id, id))
  ).at(0);
}

export async function getIndexOperationOrThrow(id: string) {
  const indexOperation = await getIndexOperation(id);
  if (!indexOperation) {
    throw new Error(`IndexOperation with id ${id} not found`);
  }
  return indexOperation;
}

export async function createIndexOperation(data: CreateIndexOperationData) {
  return (
    await writeDatabase.insert(indexOperations).values(data).returning()
  )[0];
}

export async function updateIndexOperation(
  id: string,
  data: UpdateIndexOperationData
) {
  return (
    await writeDatabase
      .update(indexOperations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(indexOperations.id, id))
      .returning()
  )[0];
}

export async function deleteIndexOperation(id: string) {
  return (
    await writeDatabase
      .delete(indexOperations)
      .where(eq(indexOperations.id, id))
      .returning()
  )[0];
}
