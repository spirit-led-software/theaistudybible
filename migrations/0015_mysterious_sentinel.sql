ALTER TABLE "ai_responses_to_source_documents" ADD COLUMN "distance" double precision DEFAULT -1 NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_responses_to_source_documents" ADD COLUMN "distance_metric" text DEFAULT 'cosine' NOT NULL;--> statement-breakpoint
ALTER TABLE "devotions_to_source_documents" ADD COLUMN "distance" double precision DEFAULT -1 NOT NULL;--> statement-breakpoint
ALTER TABLE "devotions_to_source_documents" ADD COLUMN "distance_metric" text DEFAULT 'cosine' NOT NULL;