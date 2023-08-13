ALTER TABLE "user_query_counts" DROP CONSTRAINT "user_daily_query_counts_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_daily_query_counts" RENAME TO "user_query_counts";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "max_daily_query_count" TO "max_query_count";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_query_counts" ADD CONSTRAINT "user_query_counts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
