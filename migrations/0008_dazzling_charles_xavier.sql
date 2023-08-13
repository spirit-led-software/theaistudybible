DROP INDEX IF EXISTS "user_daily_query_counts_date";--> statement-breakpoint
DROP INDEX IF EXISTS "user_daily_query_counts_user_id";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_query_counts_date" ON "user_query_counts" ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_query_counts_user_id" ON "user_query_counts" ("user_id");