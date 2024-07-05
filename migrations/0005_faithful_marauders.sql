CREATE UNIQUE INDEX IF NOT EXISTS "user_verse" ON "verse_bookmarks" USING btree ("user_id","verse_id");--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN IF EXISTS "model_id";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN IF EXISTS "search_queries";