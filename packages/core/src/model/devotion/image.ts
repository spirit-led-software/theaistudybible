import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { devotionImages } from '../../database/schema';

export type DevotionImage = typeof devotionImages.$inferSelect;

export type CreateDevotionImageData = PgInsertValue<typeof devotionImages>;
export const createDevotionImageSchema = createInsertSchema(devotionImages, {
  id: z.undefined(),
  createdAt: z.undefined(),
  updatedAt: z.undefined(),
  url: z.string().url(),
  devotionId: z.string().uuid()
});

export type UpdateDevotionImageData = PgUpdateSetSource<typeof devotionImages>;
export const updateDevotionImageSchema = createInsertSchema(devotionImages, {
  id: z.undefined(),
  createdAt: z.undefined(),
  updatedAt: z.undefined(),
  url: z
    .string()
    .nullish()
    .transform((value) => value || undefined),
  devotionId: z.undefined()
});
