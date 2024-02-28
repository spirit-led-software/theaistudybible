import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { devotions } from '../../database/schema';

export type Devotion = typeof devotions.$inferSelect;

export type CreateDevotionData = PgInsertValue<typeof devotions>;
export const createDevotionSchema = createInsertSchema(devotions, {
  id: z.undefined(),
  createdAt: z.undefined(),
  updatedAt: z.undefined()
});

export type UpdateDevotionData = PgUpdateSetSource<typeof devotions>;
export const updateDevotionSchema = createInsertSchema(devotions, {
  id: z.undefined(),
  createdAt: z.undefined(),
  updatedAt: z.undefined(),
  topic: z
    .string()
    .nullish()
    .transform((value) => value || undefined),
  bibleReading: z
    .string()
    .nullish()
    .transform((value) => value || undefined),
  summary: z
    .string()
    .nullish()
    .transform((value) => value || undefined)
});
