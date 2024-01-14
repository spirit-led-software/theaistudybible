ALTER TABLE "ai_response_reactions" DROP CONSTRAINT "ai_response_reactions_ai_response_id_ai_responses_id_fk";
--> statement-breakpoint
ALTER TABLE "ai_responses" DROP CONSTRAINT "ai_responses_user_message_id_user_messages_id_fk";
--> statement-breakpoint
ALTER TABLE "ai_responses_to_source_documents" DROP CONSTRAINT "ai_responses_to_source_documents_ai_response_id_ai_responses_id_fk";
--> statement-breakpoint
ALTER TABLE "chats" DROP CONSTRAINT "chats_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "devotion_images" DROP CONSTRAINT "devotion_images_devotion_id_devotions_id_fk";
--> statement-breakpoint
ALTER TABLE "devotion_reactions" DROP CONSTRAINT "devotion_reactions_devotion_id_devotions_id_fk";
--> statement-breakpoint
ALTER TABLE "devotions_to_source_documents" DROP CONSTRAINT "devotions_to_source_documents_devotion_id_devotions_id_fk";
--> statement-breakpoint
ALTER TABLE "index_operations" DROP CONSTRAINT "index_operations_data_source_id_data_sources_id_fk";
--> statement-breakpoint
ALTER TABLE "user_generated_image_counts" DROP CONSTRAINT "user_generated_image_counts_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_generated_images" DROP CONSTRAINT "user_generated_images_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_messages" DROP CONSTRAINT "user_messages_chat_id_chats_id_fk";
--> statement-breakpoint
ALTER TABLE "user_passwords" DROP CONSTRAINT "user_passwords_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_query_counts" DROP CONSTRAINT "user_query_counts_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users_to_roles" DROP CONSTRAINT "users_to_roles_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "devotions" ADD COLUMN "dive_deeper_queries" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_response_reactions" ADD CONSTRAINT "ai_response_reactions_ai_response_id_ai_responses_id_fk" FOREIGN KEY ("ai_response_id") REFERENCES "public"."ai_responses"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_responses" ADD CONSTRAINT "ai_responses_user_message_id_user_messages_id_fk" FOREIGN KEY ("user_message_id") REFERENCES "public"."user_messages"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_responses_to_source_documents" ADD CONSTRAINT "ai_responses_to_source_documents_ai_response_id_ai_responses_id_fk" FOREIGN KEY ("ai_response_id") REFERENCES "public"."ai_responses"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;
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
 ALTER TABLE "user_generated_image_counts" ADD CONSTRAINT "user_generated_image_counts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_generated_images" ADD CONSTRAINT "user_generated_images_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_messages" ADD CONSTRAINT "user_messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_passwords" ADD CONSTRAINT "user_passwords_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_query_counts" ADD CONSTRAINT "user_query_counts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_to_roles" ADD CONSTRAINT "users_to_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
