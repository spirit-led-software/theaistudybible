import { books } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const BookSchema = createSelectSchema(books);

export const CreateBookSchema = createInsertSchema(books).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateBookSchema = CreateBookSchema.partial().omit({
  bibleId: true,
  previousId: true,
  nextId: true,
});
