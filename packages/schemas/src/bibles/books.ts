import { books } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { defaultRefine } from '../utils/refine';

export const BookSchema = createSelectSchema(books, defaultRefine);

export const CreateBookSchema = createInsertSchema(books, defaultRefine).omit({
  createdAt: true,
  updatedAt: true,
});

export const UpdateBookSchema = CreateBookSchema.partial().omit({
  code: true,
  bibleAbbreviation: true,
  previousCode: true,
  nextCode: true,
});
