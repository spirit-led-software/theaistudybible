DROP INDEX IF EXISTS "devotions_date";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "devotions_created_at_idx" ON "devotions" ("created_at");--> statement-breakpoint
ALTER TABLE "devotions" DROP COLUMN IF EXISTS "date";