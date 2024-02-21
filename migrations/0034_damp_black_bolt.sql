CREATE TABLE IF NOT EXISTS "user_generated_images_to_source_documents" (
	"user_generated_image_id" uuid NOT NULL,
	"source_document_id" uuid NOT NULL,
	"distance" double precision DEFAULT 0 NOT NULL,
	"distance_metric" text DEFAULT 'cosine' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_generated_images" ADD COLUMN "search_queries" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_generated_image_source_document_key" ON "user_generated_images_to_source_documents" ("user_generated_image_id","source_document_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_generated_images_to_source_documents" ADD CONSTRAINT "user_generated_images_to_source_documents_user_generated_image_id_user_generated_images_id_fk" FOREIGN KEY ("user_generated_image_id") REFERENCES "user_generated_images"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
