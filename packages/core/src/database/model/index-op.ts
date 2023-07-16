import { InferModel } from "drizzle-orm";
import { PgUpdateSetSource } from "drizzle-orm/pg-core";
import { indexOperations } from "../schema";

export type IndexOperation = InferModel<typeof indexOperations, "select">;

export type CreateIndexOperationData = InferModel<
  typeof indexOperations,
  "insert"
>;

export type UpdateIndexOperationData = PgUpdateSetSource<
  typeof indexOperations
>;
