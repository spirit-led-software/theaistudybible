import { bibleLanguages } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const BibleLanguageSchema = createSelectSchema(bibleLanguages);

export const CreateBibleLanguageSchema = createInsertSchema(bibleLanguages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateBibleLanguageSchema = CreateBibleLanguageSchema.partial();
