import { bibles } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { defaultRefine } from '../utils/refine';

export const BibleSchema = createSelectSchema(bibles, defaultRefine);

export const CreateBibleSchema = createInsertSchema(bibles, defaultRefine).omit({
  createdAt: true,
  updatedAt: true,
});

export const UpdateBibleSchema = CreateBibleSchema.omit({ abbreviation: true }).partial();

export * from './books';
export * from './chapters';
export * from './verses';
