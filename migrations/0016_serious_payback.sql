CREATE TABLE IF NOT EXISTS "user_generated_image_counts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"date" date DEFAULT now() NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_generated_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"url" text,
	"user_prompt" text NOT NULL,
	"prompt" text,
	"negative_prompt" text,
	"failed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_responses_to_source_documents" ALTER COLUMN "distance" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "devotions_to_source_documents" ALTER COLUMN "distance" SET DEFAULT 0;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_generated_images_counts_date" ON "user_generated_image_counts" ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_generated_images_counts_user_id" ON "user_generated_image_counts" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_generated_images_user_id" ON "user_generated_images" ("user_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_generated_image_counts" ADD CONSTRAINT "user_generated_image_counts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_generated_images" ADD CONSTRAINT "user_generated_images_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
