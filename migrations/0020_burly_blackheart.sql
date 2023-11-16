ALTER TABLE "data_sources"
ADD COLUMN "last_manual_sync" timestamp;
--> statement-breakpoint
ALTER TABLE "data_sources"
ADD COLUMN "last_automatic_sync" timestamp;