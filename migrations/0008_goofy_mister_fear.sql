DROP INDEX IF EXISTS "chapter_bookmarks_user_chapter_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "verse_bookmarks_user_verse_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "verse_highlights_user_verse_unique";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "chapter_bookmarks_user_chapter_key" ON "chapter_bookmarks" USING btree ("user_id","chapter_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "verse_bookmarks_user_verse_key" ON "verse_bookmarks" USING btree ("user_id","verse_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "verse_highlights_user_verse_key" ON "verse_highlights" USING btree ("user_id","verse_id");