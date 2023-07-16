import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { aiResponses } from "../schema";

export const createAiResponseSchema = createInsertSchema(aiResponses);

export const updateAiResponseSchema = createInsertSchema(aiResponses, {
  id: z.never(),
  createdAt: z.never(),
  updatedAt: z.never(),
  chatId: z.never(),
  userMessageId: z.never(),
  userId: z.never(),
});
