CREATE TABLE IF NOT EXISTS "devotion_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"devotion_id" uuid NOT NULL,
	"url" text NOT NULL,
	"caption" text,
	"prompt" text,
	"negative_prompt" text
);
--> statement-breakpoint
ALTER TABLE "devotions" RENAME COLUMN "subject" TO "bible_reading";--> statement-breakpoint
ALTER TABLE "devotions" RENAME COLUMN "content" TO "summary";--> statement-breakpoint
ALTER TABLE "devotions" ADD COLUMN "reflection" text;--> statement-breakpoint
ALTER TABLE "devotions" ADD COLUMN "prayer" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "devotion_images_devotion_id" ON "devotion_images" ("devotion_id");--> statement-breakpoint
ALTER TABLE "devotions" DROP COLUMN IF EXISTS "image_caption";--> statement-breakpoint
ALTER TABLE "devotions" DROP COLUMN IF EXISTS "image_url";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "devotion_images" ADD CONSTRAINT "devotion_images_devotion_id_devotions_id_fk" FOREIGN KEY ("devotion_id") REFERENCES "devotions"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
