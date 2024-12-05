DROP INDEX IF EXISTS `source_documents_embedding_idx`;--> statement-breakpoint
CREATE INDEX `source_documents_embedding_idx` ON `source_documents` (libsql_vector_idx("embedding", 'metric=cosine', 'max_neighbors=256', 'compress_neighbors=float8', 'search_l=100'));
