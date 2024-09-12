import { chapterNotes } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { defaultRefine } from '../../utils/default-refine';

export const ChapterNoteSchema = createSelectSchema(chapterNotes, defaultRefine);

export const CreateChapterNoteSchema = createInsertSchema(chapterNotes, defaultRefine).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateChapterNoteSchema = CreateChapterNoteSchema.partial().omit({
  userId: true,
  chapterId: true,
});
