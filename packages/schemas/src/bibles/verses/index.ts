import { verses } from '@/core/database/schema';
import { defaultRefine } from '@/schemas/utils/refine';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { ContentSchema } from '../contents';

const refine = {
  ...defaultRefine,
  content: ContentSchema.array(),
};

export const VerseSchema = createSelectSchema(verses, refine);

export const CreateVerseSchema = createInsertSchema(verses, refine).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateVerseSchema = CreateVerseSchema.partial().omit({
  bibleId: true,
  bookId: true,
  chapterId: true,
  previousId: true,
  nextId: true,
});

export * from './notes';
