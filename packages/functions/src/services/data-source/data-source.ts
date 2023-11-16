import type { CreateDataSourceData, UpdateDataSourceData } from "@core/model";
import { dataSources } from "@core/schema";
import { readOnlyDatabase, readWriteDatabase } from "@lib/database";
import { SQL, desc, eq } from "drizzle-orm";

export async function getDataSources(
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
    orderBy = desc(dataSources.createdAt),
  } = options;

  return await readOnlyDatabase
    .select()
    .from(dataSources)
    .limit(limit)
    .offset(offset)
    .where(where)
    .orderBy(orderBy);
}

export async function getDataSource(id: string) {
  return (
    await readOnlyDatabase
      .select()
      .from(dataSources)
      .where(eq(dataSources.id, id))
  ).at(0);
}

export async function getDataSourceOrThrow(id: string) {
  const indexOperation = await getDataSource(id);
  if (!indexOperation) {
    throw new Error(`DataSource with id ${id} not found`);
  }
  return indexOperation;
}

export async function createDataSource(data: CreateDataSourceData) {
  return (
    await readWriteDatabase.insert(dataSources).values(data).returning()
  )[0];
}

export async function updateDataSource(id: string, data: UpdateDataSourceData) {
  return (
    await readWriteDatabase
      .update(dataSources)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(dataSources.id, id))
      .returning()
  )[0];
}

export async function deleteDataSource(id: string) {
  return (
    await readWriteDatabase
      .delete(dataSources)
      .where(eq(dataSources.id, id))
      .returning()
  )[0];
}
