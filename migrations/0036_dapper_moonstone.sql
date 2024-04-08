CREATE TABLE IF NOT EXISTS "data_sources_to_source_documents" (
	"data_source_id" uuid NOT NULL,
	"source_document_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "data_source_source_document_key" ON "data_sources_to_source_documents" ("data_source_id","source_document_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_sources_to_source_documents" ADD CONSTRAINT "data_sources_to_source_documents_data_source_id_data_sources_id_fk" FOREIGN KEY ("data_source_id") REFERENCES "data_sources"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
