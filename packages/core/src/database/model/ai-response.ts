import type { aiResponses } from "../schema";

export type AiResponse = typeof aiResponses.$inferSelect;

export type CreateAiResponseData = typeof aiResponses.$inferInsert;

export type UpdateAiResponseData = Partial<CreateAiResponseData>;
