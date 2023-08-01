CREATE TABLE IF NOT EXISTS "user_daily_query_counts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"date" date DEFAULT now() NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "max_daily_query_count" integer DEFAULT 25 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_daily_query_counts_user_id_key" ON "user_daily_query_counts" ("user_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_daily_query_counts" ADD CONSTRAINT "user_daily_query_counts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
