import { bibles } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const BibleSchema = createSelectSchema(bibles);

export const CreateBibleSchema = createInsertSchema(bibles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateBibleSchema = CreateBibleSchema.partial();
