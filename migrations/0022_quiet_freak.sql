ALTER TABLE "data_sources"
ALTER COLUMN "metadata"
SET DATA TYPE jsonb;
--> statement-breakpoint
ALTER TABLE "data_sources"
ALTER COLUMN "metadata"
SET DEFAULT '{}'::jsonb;
--> statement-breakpoint
ALTER TABLE "index_operations"
ALTER COLUMN "metadata"
SET DATA TYPE jsonb;
--> statement-breakpoint
ALTER TABLE "index_operations"
ALTER COLUMN "metadata"
SET DEFAULT '{}'::jsonb;