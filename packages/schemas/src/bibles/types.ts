import type { z } from 'zod';
import type { BibleSchema, CreateBibleSchema, UpdateBibleSchema } from './bibles';
import type { BookSchema, CreateBookSchema, UpdateBookSchema } from './books';
import type { ChapterSchema, CreateChapterSchema, UpdateChapterSchema } from './chapters/chapters';
import type { CreateVerseSchema, UpdateVerseSchema, VerseSchema } from './verses/verses';

export type Verse = z.infer<typeof VerseSchema>;
export type CreateVerse = z.infer<typeof CreateVerseSchema>;
export type UpdateVerse = z.infer<typeof UpdateVerseSchema>;

export type Chapter = z.infer<typeof ChapterSchema>;
export type CreateChapter = z.infer<typeof CreateChapterSchema>;
export type UpdateChapter = z.infer<typeof UpdateChapterSchema>;

export type Bible = z.infer<typeof BibleSchema>;
export type CreateBible = z.infer<typeof CreateBibleSchema>;
export type UpdateBible = z.infer<typeof UpdateBibleSchema>;

export type Book = z.infer<typeof BookSchema>;
export type CreateBook = z.infer<typeof CreateBookSchema>;
export type UpdateBook = z.infer<typeof UpdateBookSchema>;

export * from './chapters/types';
export * from './verses/types';
