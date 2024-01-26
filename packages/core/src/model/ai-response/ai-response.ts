import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import type { aiResponses } from '../../database/schema';

export type AiResponse = typeof aiResponses.$inferSelect;

export type CreateAiResponseData = PgInsertValue<typeof aiResponses>;

export type UpdateAiResponseData = PgUpdateSetSource<typeof aiResponses>;
