import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sourceDocuments } from "../schema";

export const createSourceDocumentSchema = createInsertSchema(sourceDocuments);

export const updateSourceDocumentSchema = createInsertSchema(sourceDocuments, {
  id: z.never(),
  createdAt: z.never(),
  updatedAt: z.never(),
});
