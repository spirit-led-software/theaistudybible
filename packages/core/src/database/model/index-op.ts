import type { indexOperations } from "../schema";

export type IndexOperation = typeof indexOperations.$inferSelect;

export type CreateIndexOperationData = typeof indexOperations.$inferInsert;

export type UpdateIndexOperationData = Partial<CreateIndexOperationData>;
