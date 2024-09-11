import { verseNotes } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const VerseNoteSchema = createSelectSchema(verseNotes);

export const CreateVerseNoteSchema = createInsertSchema(verseNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateVerseNoteSchema = CreateVerseNoteSchema.partial().omit({
  userId: true,
  verseId: true,
});
