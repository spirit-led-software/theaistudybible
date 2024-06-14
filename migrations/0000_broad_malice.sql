CREATE TABLE IF NOT EXISTS "bibles" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"abbreviation" text NOT NULL,
	"abbreviation_local" text NOT NULL,
	"name" text NOT NULL,
	"name_local" text NOT NULL,
	"description" text NOT NULL,
	"language_iso" text NOT NULL,
	"country_isos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "bibles_abbreviation_unique" UNIQUE("abbreviation")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "books" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"bible_id" text NOT NULL,
	"previous_id" text,
	"next_id" text,
	"number" integer NOT NULL,
	"abbreviation" text NOT NULL,
	"short_name" text NOT NULL,
	"long_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chapter_bookmarks" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"chapter_id" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chapters" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"bible_id" text NOT NULL,
	"book_id" text NOT NULL,
	"previous_id" text,
	"next_id" text,
	"abbreviation" text NOT NULL,
	"name" text NOT NULL,
	"number" integer NOT NULL,
	"content" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chats" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text DEFAULT 'New Chat' NOT NULL,
	"custom_name" boolean DEFAULT false NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"type" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"number_of_documents" integer DEFAULT 0 NOT NULL,
	"sync_schedule" text DEFAULT 'NEVER' NOT NULL,
	"last_manual_sync" timestamp with time zone,
	"last_automatic_sync" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_sources_to_source_documents" (
	"data_source_id" text NOT NULL,
	"source_document_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "devotion_images" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"devotion_id" text NOT NULL,
	"url" text,
	"prompt" text,
	"negative_prompt" text,
	"caption" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "devotion_reactions" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"devotion_id" text NOT NULL,
	"user_id" text NOT NULL,
	"reaction" text NOT NULL,
	"comment" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "devotions" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"topic" text DEFAULT 'general' NOT NULL,
	"bible_reading" text NOT NULL,
	"summary" text NOT NULL,
	"reflection" text,
	"prayer" text,
	"dive_deeper_queries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"failed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "devotions_to_source_documents" (
	"devotion_id" text NOT NULL,
	"source_document_id" text NOT NULL,
	"distance" double precision DEFAULT 0 NOT NULL,
	"distance_metric" text DEFAULT 'cosine' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "index_operations" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	"error_messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"data_source_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "message_reactions" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"message_id" text NOT NULL,
	"user_id" text NOT NULL,
	"reaction" text NOT NULL,
	"comment" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"tool_call_id" text,
	"content" text,
	"role" text NOT NULL,
	"name" text,
	"function_call" jsonb DEFAULT '{}'::jsonb,
	"data" jsonb,
	"tool_calls" jsonb DEFAULT '[]'::jsonb,
	"annotations" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"anonymous" boolean DEFAULT false NOT NULL,
	"chat_id" text NOT NULL,
	"user_id" text NOT NULL,
	"origin_message_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages_to_source_documents" (
	"message_id" text NOT NULL,
	"source_document_id" text NOT NULL,
	"distance" double precision DEFAULT 0 NOT NULL,
	"distance_metric" text DEFAULT 'cosine' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "share_chat_options" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"chat_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_generated_images" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"message_id" text,
	"url" text,
	"user_prompt" text NOT NULL,
	"prompt" text,
	"negative_prompt" text,
	"search_queries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"failed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_generated_images_reactions" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_generated_image_id" text NOT NULL,
	"user_id" text NOT NULL,
	"reaction" text NOT NULL,
	"comment" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_generated_images_to_source_documents" (
	"user_generated_image_id" text NOT NULL,
	"source_document_id" text NOT NULL,
	"distance" double precision DEFAULT 0 NOT NULL,
	"distance_metric" text DEFAULT 'cosine' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verse_highlights" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verse_id" text NOT NULL,
	"user_id" text NOT NULL,
	"color" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verses" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"bible_id" text NOT NULL,
	"book_id" text NOT NULL,
	"chapter_id" text NOT NULL,
	"previous_id" text,
	"next_id" text,
	"abbreviation" text NOT NULL,
	"name" text NOT NULL,
	"number" integer NOT NULL,
	"content" jsonb NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "books" ADD CONSTRAINT "books_bible_id_bibles_id_fk" FOREIGN KEY ("bible_id") REFERENCES "public"."bibles"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chapter_bookmarks" ADD CONSTRAINT "chapter_bookmarks_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chapters" ADD CONSTRAINT "chapters_bible_id_bibles_id_fk" FOREIGN KEY ("bible_id") REFERENCES "public"."bibles"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chapters" ADD CONSTRAINT "chapters_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_sources_to_source_documents" ADD CONSTRAINT "data_sources_to_source_documents_data_source_id_data_sources_id_fk" FOREIGN KEY ("data_source_id") REFERENCES "public"."data_sources"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "devotion_images" ADD CONSTRAINT "devotion_images_devotion_id_devotions_id_fk" FOREIGN KEY ("devotion_id") REFERENCES "public"."devotions"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "devotion_reactions" ADD CONSTRAINT "devotion_reactions_devotion_id_devotions_id_fk" FOREIGN KEY ("devotion_id") REFERENCES "public"."devotions"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "devotions_to_source_documents" ADD CONSTRAINT "devotions_to_source_documents_devotion_id_devotions_id_fk" FOREIGN KEY ("devotion_id") REFERENCES "public"."devotions"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "index_operations" ADD CONSTRAINT "index_operations_data_source_id_data_sources_id_fk" FOREIGN KEY ("data_source_id") REFERENCES "public"."data_sources"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_origin_message_id_messages_id_fk" FOREIGN KEY ("origin_message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "origin_message_reference" FOREIGN KEY ("origin_message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages_to_source_documents" ADD CONSTRAINT "messages_to_source_documents_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "share_chat_options" ADD CONSTRAINT "share_chat_options_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_generated_images" ADD CONSTRAINT "user_generated_images_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_generated_images_reactions" ADD CONSTRAINT "user_generated_images_reactions_user_generated_image_id_user_generated_images_id_fk" FOREIGN KEY ("user_generated_image_id") REFERENCES "public"."user_generated_images"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_generated_images_to_source_documents" ADD CONSTRAINT "user_generated_images_to_source_documents_user_generated_image_id_user_generated_images_id_fk" FOREIGN KEY ("user_generated_image_id") REFERENCES "public"."user_generated_images"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verse_highlights" ADD CONSTRAINT "verse_highlights_verse_id_verses_id_fk" FOREIGN KEY ("verse_id") REFERENCES "public"."verses"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verses" ADD CONSTRAINT "verses_bible_id_bibles_id_fk" FOREIGN KEY ("bible_id") REFERENCES "public"."bibles"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verses" ADD CONSTRAINT "verses_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verses" ADD CONSTRAINT "verses_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bibles_abbreviation" ON "bibles" USING btree ("abbreviation");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bibles_language_iso" ON "bibles" USING btree ("language_iso");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bibles_country_isos" ON "bibles" USING btree ("country_isos");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "books_abbreviation" ON "books" USING btree ("abbreviation");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "books_short_name" ON "books" USING btree ("short_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "books_long_name" ON "books" USING btree ("long_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chapter_bookmarks_chapter_id" ON "chapter_bookmarks" USING btree ("chapter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chapter_bookmarks_user_id" ON "chapter_bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chapters_name" ON "chapters" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_name" ON "chats" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "data_sources_name_key" ON "data_sources" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "data_sources_type" ON "data_sources" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "data_source_source_document_key" ON "data_sources_to_source_documents" USING btree ("data_source_id","source_document_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "devotion_images_devotion_id" ON "devotion_images" USING btree ("devotion_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "devotion_reactions_devotion_id" ON "devotion_reactions" USING btree ("devotion_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "devotions_created_at_idx" ON "devotions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "devotion_source_document_key" ON "devotions_to_source_documents" USING btree ("devotion_id","source_document_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "index_operation_status" ON "index_operations" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "message_reaction_key" ON "message_reactions" USING btree ("message_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "role" ON "messages" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content" ON "messages" USING btree ("content");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_id" ON "messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_id" ON "messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "origin_message_id" ON "messages" USING btree ("origin_message_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "anonymous" ON "messages" USING btree ("anonymous");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "message_source_document_key" ON "messages_to_source_documents" USING btree ("message_id","source_document_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_share_options_chat_id" ON "share_chat_options" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_generated_images_user_id" ON "user_generated_images" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_generated_images_message_id" ON "user_generated_images" USING btree ("message_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_generated_image_reaction_key" ON "user_generated_images_reactions" USING btree ("user_generated_image_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_generated_image_source_document_key" ON "user_generated_images_to_source_documents" USING btree ("user_generated_image_id","source_document_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verse_highlights_verse_id" ON "verse_highlights" USING btree ("verse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chapter_highlights_user_id" ON "verse_highlights" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verses_name" ON "verses" USING btree ("name");