import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import type { bibles, books, chapterHighlights, chapters, verses } from '..//database/schema';

export type Bible = typeof bibles.$inferSelect;
export type CreateBibleData = PgInsertValue<typeof bibles>;
export type UpdateBibleData = PgUpdateSetSource<typeof bibles>;

export type Book = typeof books.$inferSelect;
export type CreateBookData = PgInsertValue<typeof books>;
export type UpdateBookData = PgUpdateSetSource<typeof books>;

export type Chapter = typeof chapters.$inferSelect;
export type CreateChapterData = PgInsertValue<typeof chapters>;
export type UpdateChapterData = PgUpdateSetSource<typeof chapters>;

export type ChapterHighlight = typeof chapterHighlights.$inferSelect;
export type CreateChapterHighlightData = PgInsertValue<typeof chapterHighlights>;
export type UpdateChapterHighlightData = PgUpdateSetSource<typeof chapterHighlights>;

export type Verse = typeof verses.$inferSelect;
export type CreateVerseData = PgInsertValue<typeof verses>;
export type UpdateVerseData = PgUpdateSetSource<typeof verses>;
