import type { z } from 'zod';
import type { ChapterNoteSchema, CreateChapterNoteSchema, UpdateChapterNoteSchema } from './notes';

export type ChapterNote = z.infer<typeof ChapterNoteSchema>;
export type CreateChapterNote = z.infer<typeof CreateChapterNoteSchema>;
export type UpdateChapterNote = z.infer<typeof UpdateChapterNoteSchema>;
