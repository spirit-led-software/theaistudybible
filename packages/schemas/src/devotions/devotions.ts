import { devotions } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

const refine = {
  diveDeeperQueries: z.array(z.string()),
};

export const DevotionSchema = createSelectSchema(devotions, refine);

export const CreateDevotionSchema = createInsertSchema(devotions, refine).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateDevotionSchema = CreateDevotionSchema.partial();
