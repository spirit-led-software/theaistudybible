CREATE TABLE `source_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `chapters_to_source_documents` ALTER COLUMN "source_document_id" TO "source_document_id" text NOT NULL REFERENCES source_documents(id) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `data_sources_to_source_documents` ALTER COLUMN "source_document_id" TO "source_document_id" text NOT NULL REFERENCES source_documents(id) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `devotions_to_source_documents` ALTER COLUMN "source_document_id" TO "source_document_id" text NOT NULL REFERENCES source_documents(id) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages_to_source_documents` ALTER COLUMN "source_document_id" TO "source_document_id" text NOT NULL REFERENCES source_documents(id) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_generated_images_to_source_documents` ALTER COLUMN "source_document_id" TO "source_document_id" text NOT NULL REFERENCES source_documents(id) ON DELETE no action ON UPDATE no action;