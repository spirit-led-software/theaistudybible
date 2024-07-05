import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import type {
  bibles,
  books,
  chapterBookmarks,
  chapterNotes,
  chapters,
  verseBookmarks,
  verseHighlights,
  verseNotes,
  verses
} from '..//database/schema';

export type Bible = typeof bibles.$inferSelect;
export type CreateBibleData = PgInsertValue<typeof bibles>;
export type UpdateBibleData = PgUpdateSetSource<typeof bibles>;

export type Book = typeof books.$inferSelect;
export type CreateBookData = PgInsertValue<typeof books>;
export type UpdateBookData = PgUpdateSetSource<typeof books>;

export type Chapter = typeof chapters.$inferSelect;
export type CreateChapterData = PgInsertValue<typeof chapters>;
export type UpdateChapterData = PgUpdateSetSource<typeof chapters>;

export type ChapterNote = typeof chapterNotes.$inferSelect;
export type CreateChapterNoteData = PgInsertValue<typeof chapterNotes>;
export type UpdateChapterNoteData = PgUpdateSetSource<typeof chapterNotes>;

export type ChapterBookmark = typeof chapterBookmarks.$inferSelect;
export type CreateChapterBookmarkData = PgInsertValue<typeof chapterBookmarks>;
export type UpdateChapterBookmarkData = PgUpdateSetSource<typeof chapterBookmarks>;

export type Verse = typeof verses.$inferSelect;
export type CreateVerseData = PgInsertValue<typeof verses>;
export type UpdateVerseData = PgUpdateSetSource<typeof verses>;

export type VerseHighlight = typeof verseHighlights.$inferSelect;
export type CreateVerseHighlightData = PgInsertValue<typeof verseHighlights>;
export type UpdateVerseHighlightData = PgUpdateSetSource<typeof verseHighlights>;

export type VerseNote = typeof verseNotes.$inferSelect;
export type CreateVerseNoteData = PgInsertValue<typeof verseNotes>;
export type UpdateVerseNoteData = PgUpdateSetSource<typeof verseNotes>;

export type VerseBookmark = typeof verseBookmarks.$inferSelect;
export type CreateVerseBookmarkData = PgInsertValue<typeof verseBookmarks>;
export type UpdateVerseBookmarkData = PgUpdateSetSource<typeof verseBookmarks>;
