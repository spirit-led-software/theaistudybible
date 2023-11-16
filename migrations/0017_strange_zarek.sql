CREATE TABLE IF NOT EXISTS "data_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"metadata" json DEFAULT '{}'::json NOT NULL,
	"number_of_documents" integer DEFAULT 0 NOT NULL,
	"sync_schedule" text
);
--> statement-breakpoint
DELETE FROM "index_operations";
--> statement-breakpoint
DROP INDEX IF EXISTS "index_operation_type";
--> statement-breakpoint
ALTER TABLE "index_operations"
ADD COLUMN "data_source_id" uuid NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "data_sources_name_key" ON "data_sources" ("name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "data_sources_type" ON "data_sources" ("type");
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "index_operations"
ADD CONSTRAINT "index_operations_data_source_id_data_sources_id_fk" FOREIGN KEY ("data_source_id") REFERENCES "data_sources"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "index_operations" DROP COLUMN IF EXISTS "type";