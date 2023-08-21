ALTER TABLE "roles" ADD COLUMN "permissions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "max_query_count";