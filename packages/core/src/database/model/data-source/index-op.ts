import type { PgInsertValue, PgUpdateSetSource } from "drizzle-orm/pg-core";
import type { indexOperations } from "../../schema";

export type IndexOperation = typeof indexOperations.$inferSelect;

export type CreateIndexOperationData = PgInsertValue<typeof indexOperations>;

export type UpdateIndexOperationData = PgUpdateSetSource<
  typeof indexOperations
>;
