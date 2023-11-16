ALTER TABLE "data_sources" ALTER COLUMN "sync_schedule" SET DEFAULT 'NEVER';--> statement-breakpoint
ALTER TABLE "data_sources" ALTER COLUMN "sync_schedule" SET NOT NULL;