import { verseNotes } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { defaultRefine } from '../../utils/refine';

export const VerseNoteSchema = createSelectSchema(verseNotes, defaultRefine);

export const CreateVerseNoteSchema = createInsertSchema(verseNotes, defaultRefine).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateVerseNoteSchema = CreateVerseNoteSchema.partial().omit({
  userId: true,
  verseId: true,
});
