import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { indexOperations } from "../schema";

export const createIndexOperationSchema = createInsertSchema(indexOperations);

export const updateIndexOperationSchema = createInsertSchema(indexOperations, {
  id: z.never(),
  createdAt: z.never(),
  updatedAt: z.never(),
});
