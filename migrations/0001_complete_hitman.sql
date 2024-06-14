CREATE TABLE IF NOT EXISTS "chapters_to_source_documents" (
	"chapter_id" text NOT NULL,
	"source_document_id" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chapters_to_source_documents" ADD CONSTRAINT "chapters_to_source_documents_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "chapter_source_document_key" ON "chapters_to_source_documents" USING btree ("chapter_id","source_document_id");