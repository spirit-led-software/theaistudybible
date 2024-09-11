import { chapterNotes } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const ChapterNoteSchema = createSelectSchema(chapterNotes);

export const CreateChapterNoteSchema = createInsertSchema(chapterNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateChapterNoteSchema = CreateChapterNoteSchema.partial().omit({
  userId: true,
  chapterId: true,
});
