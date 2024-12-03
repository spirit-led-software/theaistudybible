import type { z } from 'zod';
import type { ChapterSchema, CreateChapterSchema, UpdateChapterSchema } from '.';
import type { ChapterNoteSchema, CreateChapterNoteSchema, UpdateChapterNoteSchema } from './notes';

export type Chapter = z.infer<typeof ChapterSchema>;
export type CreateChapter = z.infer<typeof CreateChapterSchema>;
export type UpdateChapter = z.infer<typeof UpdateChapterSchema>;

export type ChapterNote = z.infer<typeof ChapterNoteSchema>;
export type CreateChapterNote = z.infer<typeof CreateChapterNoteSchema>;
export type UpdateChapterNote = z.infer<typeof UpdateChapterNoteSchema>;
