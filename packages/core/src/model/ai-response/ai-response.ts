import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { aiResponses } from '../../database/schema';

export type AiResponse = typeof aiResponses.$inferSelect;

export type CreateAiResponseData = PgInsertValue<typeof aiResponses>;
export const createAiResponseSchema = createInsertSchema(aiResponses, {
  id: z.undefined(),
  createdAt: z.undefined(),
  updatedAt: z.undefined(),
  modelId: z.enum(aiResponses.modelId.enumValues),
  searchQueries: z.array(z.string()).optional(),
  userId: z.string().uuid(),
  chatId: z.string().uuid(),
  userMessageId: z.string().uuid()
});
export type CreateAiResponseInput = z.input<typeof createAiResponseSchema>;

export type UpdateAiResponseData = PgUpdateSetSource<typeof aiResponses>;
export const updateAiResponseSchema = z.object({
  id: z.undefined(),
  createdAt: z.undefined(),
  updatedAt: z.undefined(),
  modelId: z.enum(aiResponses.modelId.enumValues),
  searchQueries: z.array(z.string()).optional(),
  userId: z.undefined(),
  chatId: z.undefined(),
  userMessageId: z.undefined()
});
export type UpdateAiResponseInput = z.input<typeof updateAiResponseSchema>;
