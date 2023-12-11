DROP INDEX IF EXISTS "user_generated_images_counts_date";--> statement-breakpoint
DROP INDEX IF EXISTS "user_query_counts_date";--> statement-breakpoint
ALTER TABLE "user_generated_image_counts" DROP COLUMN IF EXISTS "date";--> statement-breakpoint
ALTER TABLE "user_query_counts" DROP COLUMN IF EXISTS "date";