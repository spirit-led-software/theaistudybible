ALTER TABLE "verse_highlights" DROP CONSTRAINT "verse_highlights_verse_id_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "user_verse";--> statement-breakpoint
DROP INDEX IF EXISTS "chapter_highlights_user_id";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "chapter_bookmarks_user_chapter_unique" ON "chapter_bookmarks" USING btree ("user_id","chapter_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "chapter_notes_user_chapter_unique" ON "chapter_notes" USING btree ("user_id","chapter_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "verse_bookmarks_user_verse_unique" ON "verse_bookmarks" USING btree ("user_id","verse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verse_highlights_user_verse_unique" ON "verse_highlights" USING btree ("user_id","verse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verse_highlights_user_id" ON "verse_highlights" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "verse_notes_user_verse_unique" ON "verse_notes" USING btree ("user_id","verse_id");