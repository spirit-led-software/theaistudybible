import { bibles } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

const refine = {
  countryISOs: z.array(z.string()),
};

export const BibleSchema = createSelectSchema(bibles, refine);

export const CreateBibleSchema = createInsertSchema(bibles, refine).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateBibleSchema = CreateBibleSchema.partial();
