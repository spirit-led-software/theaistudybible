import { InferModel } from "drizzle-orm";
import { PgUpdateSetSource } from "drizzle-orm/pg-core";
import { sourceDocuments } from "../schema";

export type SourceDocument = InferModel<typeof sourceDocuments, "select">;

export type CreateSourceDocumentData = InferModel<
  typeof sourceDocuments,
  "insert"
>;

export type UpdateSourceDocumentData = PgUpdateSetSource<
  typeof sourceDocuments
>;
