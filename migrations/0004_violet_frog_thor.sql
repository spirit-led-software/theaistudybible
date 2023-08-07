ALTER TABLE "ai_responses_to_source_documents" DROP CONSTRAINT "ai_responses_to_source_documents_source_document_id_source_documents_id_fk";
--> statement-breakpoint
ALTER TABLE "devotions_to_source_documents" DROP CONSTRAINT "devotions_to_source_documents_source_document_id_source_documents_id_fk";
--> statement-breakpoint
DROP TABLE "source_documents";