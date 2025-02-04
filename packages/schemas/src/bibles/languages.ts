import { bibleLanguages } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { defaultRefine } from '../utils/refine';

export const BibleLanguageSchema = createSelectSchema(bibleLanguages, defaultRefine);

export const CreateBibleLanguageSchema = createInsertSchema(bibleLanguages, defaultRefine).omit({
  createdAt: true,
  updatedAt: true,
});

export const UpdateBibleLanguageSchema = CreateBibleLanguageSchema.omit({ iso: true }).partial();
