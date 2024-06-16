import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import type { bibles, books, chapters, verseHighlights, verses } from '..//database/schema';

export type Bible = typeof bibles.$inferSelect;
export type CreateBibleData = PgInsertValue<typeof bibles>;
export type UpdateBibleData = PgUpdateSetSource<typeof bibles>;

export type Book = typeof books.$inferSelect;
export type CreateBookData = PgInsertValue<typeof books>;
export type UpdateBookData = PgUpdateSetSource<typeof books>;

export type Chapter = typeof chapters.$inferSelect;
export type CreateChapterData = PgInsertValue<typeof chapters>;
export type UpdateChapterData = PgUpdateSetSource<typeof chapters>;

export type VerseHighlight = typeof verseHighlights.$inferSelect;
export type CreateVerseHighlightData = PgInsertValue<typeof verseHighlights>;
export type UpdateVerseHighlightData = PgUpdateSetSource<typeof verseHighlights>;

export type Verse = typeof verses.$inferSelect;
export type CreateVerseData = PgInsertValue<typeof verses>;
export type UpdateVerseData = PgUpdateSetSource<typeof verses>;
