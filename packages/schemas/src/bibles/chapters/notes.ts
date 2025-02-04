import { chapterNotes } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { defaultRefine } from '../../utils/refine';

export const ChapterNoteSchema = createSelectSchema(chapterNotes, defaultRefine);

export const CreateChapterNoteSchema = createInsertSchema(chapterNotes, defaultRefine).omit({
  createdAt: true,
  updatedAt: true,
});

export const UpdateChapterNoteSchema = CreateChapterNoteSchema.partial().omit({
  userId: true,
  chapterCode: true,
});
