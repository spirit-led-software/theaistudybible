DROP INDEX "bible_contributors_uid_idx";--> statement-breakpoint
DROP INDEX "bible_countries_iso_idx";--> statement-breakpoint
DROP INDEX "bible_languages_iso_idx";--> statement-breakpoint
DROP INDEX "bible_languages_name_idx";--> statement-breakpoint
DROP INDEX "bible_languages_name_local_idx";--> statement-breakpoint
DROP INDEX "bible_languages_script_code_idx";--> statement-breakpoint
DROP INDEX "bible_languages_script_direction_idx";--> statement-breakpoint
DROP INDEX "bible_rights_admins_uid_idx";--> statement-breakpoint
DROP INDEX "bible_rights_holders_uid_idx";--> statement-breakpoint
DROP INDEX "bible_rights_holders_abbr_idx";--> statement-breakpoint
DROP INDEX "bibles_abbreviation_idx";--> statement-breakpoint
DROP INDEX "bibles_abbreviation_local_idx";--> statement-breakpoint
DROP INDEX "bibles_name_idx";--> statement-breakpoint
DROP INDEX "bibles_name_local_idx";--> statement-breakpoint
DROP INDEX "bibles_to_contributors_bible_id_idx";--> statement-breakpoint
DROP INDEX "bibles_to_contributors_contributor_id_idx";--> statement-breakpoint
DROP INDEX "bibles_to_countries_bible_id_idx";--> statement-breakpoint
DROP INDEX "bibles_to_countries_country_id_idx";--> statement-breakpoint
DROP INDEX "bibles_to_languages_bible_id_idx";--> statement-breakpoint
DROP INDEX "bibles_to_languages_language_id_idx";--> statement-breakpoint
DROP INDEX "bibles_to_rights_admins_bible_id_idx";--> statement-breakpoint
DROP INDEX "bibles_to_rights_admins_rights_admin_id_idx";--> statement-breakpoint
DROP INDEX "bibles_to_rights_holders_bible_id_idx";--> statement-breakpoint
DROP INDEX "bibles_to_rights_holders_rights_holder_id_idx";--> statement-breakpoint
DROP INDEX "books_bible_id_idx";--> statement-breakpoint
DROP INDEX "books_previous_id_idx";--> statement-breakpoint
DROP INDEX "books_next_id_idx";--> statement-breakpoint
DROP INDEX "books_number_idx";--> statement-breakpoint
DROP INDEX "books_code_idx";--> statement-breakpoint
DROP INDEX "books_abbreviation_idx";--> statement-breakpoint
DROP INDEX "chapter_bookmarks_unique_user_chapter_idx";--> statement-breakpoint
DROP INDEX "chapter_bookmarks_chapter_id_idx";--> statement-breakpoint
DROP INDEX "chapter_bookmarks_user_id_idx";--> statement-breakpoint
DROP INDEX "chapter_notes_chapter_id_idx";--> statement-breakpoint
DROP INDEX "chapter_notes_user_id_idx";--> statement-breakpoint
DROP INDEX "chapters_bible_id_idx";--> statement-breakpoint
DROP INDEX "chapters_book_id_idx";--> statement-breakpoint
DROP INDEX "chapters_previous_id_idx";--> statement-breakpoint
DROP INDEX "chapters_next_id_idx";--> statement-breakpoint
DROP INDEX "chapters_code_idx";--> statement-breakpoint
DROP INDEX "chapters_name_idx";--> statement-breakpoint
DROP INDEX "chapters_number_idx";--> statement-breakpoint
DROP INDEX "chapters_to_source_documents_chapter_id_idx";--> statement-breakpoint
DROP INDEX "chapters_to_source_documents_source_document_id_idx";--> statement-breakpoint
DROP INDEX "chats_user_id_idx";--> statement-breakpoint
DROP INDEX "chats_name_idx";--> statement-breakpoint
DROP INDEX "data_sources_name_key";--> statement-breakpoint
DROP INDEX "data_sources_type_idx";--> statement-breakpoint
DROP INDEX "data_sources_metadata_idx";--> statement-breakpoint
DROP INDEX "data_sources_last_manual_sync_idx";--> statement-breakpoint
DROP INDEX "data_sources_last_automatic_sync_idx";--> statement-breakpoint
DROP INDEX "data_sources_to_source_documents_data_source_id_idx";--> statement-breakpoint
DROP INDEX "data_sources_to_source_documents_source_document_id_idx";--> statement-breakpoint
DROP INDEX "devotion_images_devotion_id_idx";--> statement-breakpoint
DROP INDEX "devotion_images_caption_idx";--> statement-breakpoint
DROP INDEX "devotion_reactions_unique_user_idx";--> statement-breakpoint
DROP INDEX "devotion_reactions_devotion_id_idx";--> statement-breakpoint
DROP INDEX "devotion_reactions_user_id_idx";--> statement-breakpoint
DROP INDEX "devotion_reactions_reaction_idx";--> statement-breakpoint
DROP INDEX "devotions_topic_idx";--> statement-breakpoint
DROP INDEX "devotions_created_at_idx";--> statement-breakpoint
DROP INDEX "devotions_failed_idx";--> statement-breakpoint
DROP INDEX "devotions_to_source_documents_devotion_id_idx";--> statement-breakpoint
DROP INDEX "devotions_to_source_documents_source_document_id_idx";--> statement-breakpoint
DROP INDEX "forgotten_password_codes_code_idx";--> statement-breakpoint
DROP INDEX "forgotten_password_codes_user_id_idx";--> statement-breakpoint
DROP INDEX "index_operation_data_source_id_idx";--> statement-breakpoint
DROP INDEX "index_operation_status_idx";--> statement-breakpoint
DROP INDEX "index_operation_metadata_idx";--> statement-breakpoint
DROP INDEX "message_reactions_unique_user_idx";--> statement-breakpoint
DROP INDEX "message_reactions_message_id_idx";--> statement-breakpoint
DROP INDEX "message_reactions_user_id_idx";--> statement-breakpoint
DROP INDEX "messages_chat_id_idx";--> statement-breakpoint
DROP INDEX "messages_user_id_idx";--> statement-breakpoint
DROP INDEX "messages_origin_message_id_idx";--> statement-breakpoint
DROP INDEX "messages_role_idx";--> statement-breakpoint
DROP INDEX "messages_content_idx";--> statement-breakpoint
DROP INDEX "messages_finish_reason_idx";--> statement-breakpoint
DROP INDEX "messages_to_source_documents_message_id_idx";--> statement-breakpoint
DROP INDEX "messages_to_source_documents_source_document_id_idx";--> statement-breakpoint
DROP INDEX "passkey_credential_user_id_idx";--> statement-breakpoint
DROP INDEX "passkey_credential_algorithm_id_idx";--> statement-breakpoint
DROP INDEX "passwords_user_id_idx";--> statement-breakpoint
DROP INDEX "push_subscriptions_endpoint_idx";--> statement-breakpoint
DROP INDEX "push_subscriptions_user_id_idx";--> statement-breakpoint
DROP INDEX "reading_sessions_user_id_idx";--> statement-breakpoint
DROP INDEX "reading_sessions_start_time_idx";--> statement-breakpoint
DROP INDEX "reading_sessions_end_time_idx";--> statement-breakpoint
DROP INDEX "roles_name_idx";--> statement-breakpoint
DROP INDEX "sessions_user_id_idx";--> statement-breakpoint
DROP INDEX "chat_share_options_chat_id_idx";--> statement-breakpoint
DROP INDEX "user_credits_user_id_idx";--> statement-breakpoint
DROP INDEX "user_generated_images_user_id_idx";--> statement-breakpoint
DROP INDEX "user_generated_images_message_id_idx";--> statement-breakpoint
DROP INDEX "user_generated_images_user_prompt_idx";--> statement-breakpoint
DROP INDEX "user_generated_images_failed_idx";--> statement-breakpoint
DROP INDEX "user_generated_image_reaction_idx";--> statement-breakpoint
DROP INDEX "user_generated_images_reactions_user_generated_image_id_idx";--> statement-breakpoint
DROP INDEX "user_generated_images_reactions_user_id_idx";--> statement-breakpoint
DROP INDEX "user_generated_images_reactions_reaction_idx";--> statement-breakpoint
DROP INDEX "user_generated_images_to_source_documents_user_generated_image_id_idx";--> statement-breakpoint
DROP INDEX "user_generated_images_to_source_documents_source_document_id_idx";--> statement-breakpoint
DROP INDEX "user_settings_user_id_idx";--> statement-breakpoint
DROP INDEX "user_settings_preferred_bible_id_idx";--> statement-breakpoint
DROP INDEX "users_email_idx";--> statement-breakpoint
DROP INDEX "users_stripe_customer_id_idx";--> statement-breakpoint
DROP INDEX "users_to_roles_user_id_idx";--> statement-breakpoint
DROP INDEX "users_to_roles_role_id_idx";--> statement-breakpoint
DROP INDEX "verse_bookmarks_unique_user_verse_idx";--> statement-breakpoint
DROP INDEX "verse_bookmarks_verse_id_idx";--> statement-breakpoint
DROP INDEX "verse_bookmarks_user_id_idx";--> statement-breakpoint
DROP INDEX "verse_highlights_unique_user_verse_idx";--> statement-breakpoint
DROP INDEX "verse_highlights_verse_id_idx";--> statement-breakpoint
DROP INDEX "verse_highlights_user_id_idx";--> statement-breakpoint
DROP INDEX "verse_notes_verse_id_idx";--> statement-breakpoint
DROP INDEX "verse_notes_user_id_idx";--> statement-breakpoint
DROP INDEX "verses_bible_id_idx";--> statement-breakpoint
DROP INDEX "verses_book_id_idx";--> statement-breakpoint
DROP INDEX "verses_chapter_id_idx";--> statement-breakpoint
DROP INDEX "verses_previous_id_idx";--> statement-breakpoint
DROP INDEX "verses_next_id_idx";--> statement-breakpoint
DROP INDEX "verses_code_idx";--> statement-breakpoint
DROP INDEX "verses_name_idx";--> statement-breakpoint
DROP INDEX "verses_number_idx";--> statement-breakpoint
ALTER TABLE `push_subscriptions` ALTER COLUMN "p256dh" TO "p256dh" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `bible_contributors_uid_idx` ON `bible_contributors` (`uid`);--> statement-breakpoint
CREATE UNIQUE INDEX `bible_countries_iso_idx` ON `bible_countries` (`iso`);--> statement-breakpoint
CREATE UNIQUE INDEX `bible_languages_iso_idx` ON `bible_languages` (`iso`);--> statement-breakpoint
CREATE INDEX `bible_languages_name_idx` ON `bible_languages` (`name`);--> statement-breakpoint
CREATE INDEX `bible_languages_name_local_idx` ON `bible_languages` (`name_local`);--> statement-breakpoint
CREATE INDEX `bible_languages_script_code_idx` ON `bible_languages` (`script_code`);--> statement-breakpoint
CREATE INDEX `bible_languages_script_direction_idx` ON `bible_languages` (`script_direction`);--> statement-breakpoint
CREATE UNIQUE INDEX `bible_rights_admins_uid_idx` ON `bible_rights_admins` (`uid`);--> statement-breakpoint
CREATE UNIQUE INDEX `bible_rights_holders_uid_idx` ON `bible_rights_holders` (`uid`);--> statement-breakpoint
CREATE INDEX `bible_rights_holders_abbr_idx` ON `bible_rights_holders` (`abbr`);--> statement-breakpoint
CREATE UNIQUE INDEX `bibles_abbreviation_idx` ON `bibles` (`abbreviation`);--> statement-breakpoint
CREATE INDEX `bibles_abbreviation_local_idx` ON `bibles` (`abbreviation_local`);--> statement-breakpoint
CREATE INDEX `bibles_name_idx` ON `bibles` (`name`);--> statement-breakpoint
CREATE INDEX `bibles_name_local_idx` ON `bibles` (`name_local`);--> statement-breakpoint
CREATE INDEX `bibles_to_contributors_bible_id_idx` ON `bibles_to_contributors` (`bible_id`);--> statement-breakpoint
CREATE INDEX `bibles_to_contributors_contributor_id_idx` ON `bibles_to_contributors` (`contributor_id`);--> statement-breakpoint
CREATE INDEX `bibles_to_countries_bible_id_idx` ON `bibles_to_countries` (`bible_id`);--> statement-breakpoint
CREATE INDEX `bibles_to_countries_country_id_idx` ON `bibles_to_countries` (`country_id`);--> statement-breakpoint
CREATE INDEX `bibles_to_languages_bible_id_idx` ON `bibles_to_languages` (`bible_id`);--> statement-breakpoint
CREATE INDEX `bibles_to_languages_language_id_idx` ON `bibles_to_languages` (`language_id`);--> statement-breakpoint
CREATE INDEX `bibles_to_rights_admins_bible_id_idx` ON `bibles_to_rights_admins` (`bible_id`);--> statement-breakpoint
CREATE INDEX `bibles_to_rights_admins_rights_admin_id_idx` ON `bibles_to_rights_admins` (`rights_admin_id`);--> statement-breakpoint
CREATE INDEX `bibles_to_rights_holders_bible_id_idx` ON `bibles_to_rights_holders` (`bible_id`);--> statement-breakpoint
CREATE INDEX `bibles_to_rights_holders_rights_holder_id_idx` ON `bibles_to_rights_holders` (`rights_holder_id`);--> statement-breakpoint
CREATE INDEX `books_bible_id_idx` ON `books` (`bible_id`);--> statement-breakpoint
CREATE INDEX `books_previous_id_idx` ON `books` (`previous_id`);--> statement-breakpoint
CREATE INDEX `books_next_id_idx` ON `books` (`next_id`);--> statement-breakpoint
CREATE INDEX `books_number_idx` ON `books` (`number`);--> statement-breakpoint
CREATE INDEX `books_code_idx` ON `books` (`code`);--> statement-breakpoint
CREATE INDEX `books_abbreviation_idx` ON `books` (`abbreviation`);--> statement-breakpoint
CREATE UNIQUE INDEX `chapter_bookmarks_unique_user_chapter_idx` ON `chapter_bookmarks` (`chapter_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `chapter_bookmarks_chapter_id_idx` ON `chapter_bookmarks` (`chapter_id`);--> statement-breakpoint
CREATE INDEX `chapter_bookmarks_user_id_idx` ON `chapter_bookmarks` (`user_id`);--> statement-breakpoint
CREATE INDEX `chapter_notes_chapter_id_idx` ON `chapter_notes` (`chapter_id`);--> statement-breakpoint
CREATE INDEX `chapter_notes_user_id_idx` ON `chapter_notes` (`user_id`);--> statement-breakpoint
CREATE INDEX `chapters_bible_id_idx` ON `chapters` (`bible_id`);--> statement-breakpoint
CREATE INDEX `chapters_book_id_idx` ON `chapters` (`book_id`);--> statement-breakpoint
CREATE INDEX `chapters_previous_id_idx` ON `chapters` (`previous_id`);--> statement-breakpoint
CREATE INDEX `chapters_next_id_idx` ON `chapters` (`next_id`);--> statement-breakpoint
CREATE INDEX `chapters_code_idx` ON `chapters` (`code`);--> statement-breakpoint
CREATE INDEX `chapters_name_idx` ON `chapters` (`name`);--> statement-breakpoint
CREATE INDEX `chapters_number_idx` ON `chapters` (`number`);--> statement-breakpoint
CREATE INDEX `chapters_to_source_documents_chapter_id_idx` ON `chapters_to_source_documents` (`chapter_id`);--> statement-breakpoint
CREATE INDEX `chapters_to_source_documents_source_document_id_idx` ON `chapters_to_source_documents` (`source_document_id`);--> statement-breakpoint
CREATE INDEX `chats_user_id_idx` ON `chats` (`user_id`);--> statement-breakpoint
CREATE INDEX `chats_name_idx` ON `chats` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `data_sources_name_key` ON `data_sources` (`name`);--> statement-breakpoint
CREATE INDEX `data_sources_type_idx` ON `data_sources` (`type`);--> statement-breakpoint
CREATE INDEX `data_sources_metadata_idx` ON `data_sources` (`metadata`);--> statement-breakpoint
CREATE INDEX `data_sources_last_manual_sync_idx` ON `data_sources` (`last_manual_sync`);--> statement-breakpoint
CREATE INDEX `data_sources_last_automatic_sync_idx` ON `data_sources` (`last_automatic_sync`);--> statement-breakpoint
CREATE INDEX `data_sources_to_source_documents_data_source_id_idx` ON `data_sources_to_source_documents` (`data_source_id`);--> statement-breakpoint
CREATE INDEX `data_sources_to_source_documents_source_document_id_idx` ON `data_sources_to_source_documents` (`source_document_id`);--> statement-breakpoint
CREATE INDEX `devotion_images_devotion_id_idx` ON `devotion_images` (`devotion_id`);--> statement-breakpoint
CREATE INDEX `devotion_images_caption_idx` ON `devotion_images` (`caption`);--> statement-breakpoint
CREATE UNIQUE INDEX `devotion_reactions_unique_user_idx` ON `devotion_reactions` (`devotion_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `devotion_reactions_devotion_id_idx` ON `devotion_reactions` (`devotion_id`);--> statement-breakpoint
CREATE INDEX `devotion_reactions_user_id_idx` ON `devotion_reactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `devotion_reactions_reaction_idx` ON `devotion_reactions` (`reaction`);--> statement-breakpoint
CREATE INDEX `devotions_topic_idx` ON `devotions` (`topic`);--> statement-breakpoint
CREATE INDEX `devotions_created_at_idx` ON `devotions` (`created_at`);--> statement-breakpoint
CREATE INDEX `devotions_failed_idx` ON `devotions` (`failed`);--> statement-breakpoint
CREATE INDEX `devotions_to_source_documents_devotion_id_idx` ON `devotions_to_source_documents` (`devotion_id`);--> statement-breakpoint
CREATE INDEX `devotions_to_source_documents_source_document_id_idx` ON `devotions_to_source_documents` (`source_document_id`);--> statement-breakpoint
CREATE INDEX `forgotten_password_codes_code_idx` ON `forgotten_password_codes` (`code`);--> statement-breakpoint
CREATE INDEX `forgotten_password_codes_user_id_idx` ON `forgotten_password_codes` (`userId`);--> statement-breakpoint
CREATE INDEX `index_operation_data_source_id_idx` ON `index_operations` (`data_source_id`);--> statement-breakpoint
CREATE INDEX `index_operation_status_idx` ON `index_operations` (`status`);--> statement-breakpoint
CREATE INDEX `index_operation_metadata_idx` ON `index_operations` (`metadata`);--> statement-breakpoint
CREATE UNIQUE INDEX `message_reactions_unique_user_idx` ON `message_reactions` (`message_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `message_reactions_message_id_idx` ON `message_reactions` (`message_id`);--> statement-breakpoint
CREATE INDEX `message_reactions_user_id_idx` ON `message_reactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `messages_chat_id_idx` ON `messages` (`chat_id`);--> statement-breakpoint
CREATE INDEX `messages_user_id_idx` ON `messages` (`user_id`);--> statement-breakpoint
CREATE INDEX `messages_origin_message_id_idx` ON `messages` (`origin_message_id`);--> statement-breakpoint
CREATE INDEX `messages_role_idx` ON `messages` (`role`);--> statement-breakpoint
CREATE INDEX `messages_content_idx` ON `messages` (`content`);--> statement-breakpoint
CREATE INDEX `messages_finish_reason_idx` ON `messages` (`finish_reason`);--> statement-breakpoint
CREATE INDEX `messages_to_source_documents_message_id_idx` ON `messages_to_source_documents` (`message_id`);--> statement-breakpoint
CREATE INDEX `messages_to_source_documents_source_document_id_idx` ON `messages_to_source_documents` (`source_document_id`);--> statement-breakpoint
CREATE INDEX `passkey_credential_user_id_idx` ON `passkey_credential` (`user_id`);--> statement-breakpoint
CREATE INDEX `passkey_credential_algorithm_id_idx` ON `passkey_credential` (`algorithm_id`);--> statement-breakpoint
CREATE INDEX `passwords_user_id_idx` ON `passwords` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `push_subscriptions_endpoint_idx` ON `push_subscriptions` (`endpoint`);--> statement-breakpoint
CREATE INDEX `push_subscriptions_user_id_idx` ON `push_subscriptions` (`user_id`);--> statement-breakpoint
CREATE INDEX `reading_sessions_user_id_idx` ON `reading_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `reading_sessions_start_time_idx` ON `reading_sessions` (`start_time`);--> statement-breakpoint
CREATE INDEX `reading_sessions_end_time_idx` ON `reading_sessions` (`end_time`);--> statement-breakpoint
CREATE INDEX `roles_name_idx` ON `roles` (`name`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `chat_share_options_chat_id_idx` ON `share_chat_options` (`chat_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_credits_user_id_idx` ON `user_credits` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_generated_images_user_id_idx` ON `user_generated_images` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_generated_images_message_id_idx` ON `user_generated_images` (`message_id`);--> statement-breakpoint
CREATE INDEX `user_generated_images_user_prompt_idx` ON `user_generated_images` (`user_prompt`);--> statement-breakpoint
CREATE INDEX `user_generated_images_failed_idx` ON `user_generated_images` (`failed`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_generated_image_reaction_idx` ON `user_generated_images_reactions` (`user_generated_image_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `user_generated_images_reactions_user_generated_image_id_idx` ON `user_generated_images_reactions` (`user_generated_image_id`);--> statement-breakpoint
CREATE INDEX `user_generated_images_reactions_user_id_idx` ON `user_generated_images_reactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_generated_images_reactions_reaction_idx` ON `user_generated_images_reactions` (`reaction`);--> statement-breakpoint
CREATE INDEX `user_generated_images_to_source_documents_user_generated_image_id_idx` ON `user_generated_images_to_source_documents` (`user_generated_image_id`);--> statement-breakpoint
CREATE INDEX `user_generated_images_to_source_documents_source_document_id_idx` ON `user_generated_images_to_source_documents` (`source_document_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_settings_user_id_idx` ON `user_settings` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_settings_preferred_bible_id_idx` ON `user_settings` (`preferred_bible_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_stripe_customer_id_idx` ON `users` (`stripe_customer_id`);--> statement-breakpoint
CREATE INDEX `users_to_roles_user_id_idx` ON `users_to_roles` (`user_id`);--> statement-breakpoint
CREATE INDEX `users_to_roles_role_id_idx` ON `users_to_roles` (`role_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `verse_bookmarks_unique_user_verse_idx` ON `verse_bookmarks` (`user_id`,`verse_id`);--> statement-breakpoint
CREATE INDEX `verse_bookmarks_verse_id_idx` ON `verse_bookmarks` (`verse_id`);--> statement-breakpoint
CREATE INDEX `verse_bookmarks_user_id_idx` ON `verse_bookmarks` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `verse_highlights_unique_user_verse_idx` ON `verse_highlights` (`user_id`,`verse_id`);--> statement-breakpoint
CREATE INDEX `verse_highlights_verse_id_idx` ON `verse_highlights` (`verse_id`);--> statement-breakpoint
CREATE INDEX `verse_highlights_user_id_idx` ON `verse_highlights` (`user_id`);--> statement-breakpoint
CREATE INDEX `verse_notes_verse_id_idx` ON `verse_notes` (`verse_id`);--> statement-breakpoint
CREATE INDEX `verse_notes_user_id_idx` ON `verse_notes` (`user_id`);--> statement-breakpoint
CREATE INDEX `verses_bible_id_idx` ON `verses` (`bible_id`);--> statement-breakpoint
CREATE INDEX `verses_book_id_idx` ON `verses` (`book_id`);--> statement-breakpoint
CREATE INDEX `verses_chapter_id_idx` ON `verses` (`chapter_id`);--> statement-breakpoint
CREATE INDEX `verses_previous_id_idx` ON `verses` (`previous_id`);--> statement-breakpoint
CREATE INDEX `verses_next_id_idx` ON `verses` (`next_id`);--> statement-breakpoint
CREATE INDEX `verses_code_idx` ON `verses` (`code`);--> statement-breakpoint
CREATE INDEX `verses_name_idx` ON `verses` (`name`);--> statement-breakpoint
CREATE INDEX `verses_number_idx` ON `verses` (`number`);--> statement-breakpoint
ALTER TABLE `push_subscriptions` ALTER COLUMN "auth" TO "auth" text NOT NULL;