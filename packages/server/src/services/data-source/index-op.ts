import { db } from '@lib/database';
import { indexOperations } from '@revelationsai/core/database/schema';
import type {
  CreateIndexOperationData,
  UpdateIndexOperationData
} from '@revelationsai/core/model/data-source/index-op';
import { desc, eq, type SQL } from 'drizzle-orm';

export async function getIndexOperations(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(indexOperations.createdAt) } = options;

  return await db
    .select()
    .from(indexOperations)
    .limit(limit)
    .offset(offset)
    .where(where)
    .orderBy(orderBy);
}

export async function getIndexOperation(id: string) {
  return (await db.select().from(indexOperations).where(eq(indexOperations.id, id))).at(0);
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
    await db
      .insert(indexOperations)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()
  )[0];
}

export async function updateIndexOperation(id: string, data: UpdateIndexOperationData) {
  return (
    await db
      .update(indexOperations)
      .set({
        ...data,
        createdAt: undefined,
        updatedAt: new Date()
      })
      .where(eq(indexOperations.id, id))
      .returning()
  )[0];
}

export async function deleteIndexOperation(id: string) {
  return (await db.delete(indexOperations).where(eq(indexOperations.id, id)).returning())[0];
}
