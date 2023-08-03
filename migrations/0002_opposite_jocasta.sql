ALTER TABLE "devotions" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "devotions" ADD COLUMN "failed" boolean DEFAULT false NOT NULL;