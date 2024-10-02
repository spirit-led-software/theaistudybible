CREATE TABLE `bible_contributors` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`uid` text NOT NULL,
	`name` text NOT NULL,
	`content` integer DEFAULT false NOT NULL,
	`publication` integer DEFAULT false NOT NULL,
	`management` integer DEFAULT false NOT NULL,
	`finance` integer DEFAULT false NOT NULL,
	`qa` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bible_countries` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`iso` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bible_languages` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`iso` text NOT NULL,
	`name` text NOT NULL,
	`name_local` text NOT NULL,
	`script` text NOT NULL,
	`script_code` text NOT NULL,
	`script_direction` text NOT NULL,
	`ldml` text NOT NULL,
	`rod` integer,
	`numerals` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bible_rights_admins` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`uid` text NOT NULL,
	`name` text NOT NULL,
	`url` text
);
--> statement-breakpoint
CREATE TABLE `bible_rights_holders` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`uid` text NOT NULL,
	`name` text NOT NULL,
	`name_local` text NOT NULL,
	`abbr` text NOT NULL,
	`url` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bibles` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`abbreviation` text NOT NULL,
	`abbreviation_local` text NOT NULL,
	`name` text NOT NULL,
	`name_local` text NOT NULL,
	`description` text NOT NULL,
	`copyright_statement` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bibles_to_contributors` (
	`bible_id` text NOT NULL,
	`contributor_id` text NOT NULL,
	PRIMARY KEY(`bible_id`, `contributor_id`),
	FOREIGN KEY (`bible_id`) REFERENCES `bibles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contributor_id`) REFERENCES `bible_contributors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bibles_to_countries` (
	`bible_id` text NOT NULL,
	`country_id` text NOT NULL,
	PRIMARY KEY(`bible_id`, `country_id`),
	FOREIGN KEY (`bible_id`) REFERENCES `bibles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`country_id`) REFERENCES `bible_countries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bibles_to_languages` (
	`bible_id` text NOT NULL,
	`language_id` text NOT NULL,
	PRIMARY KEY(`bible_id`, `language_id`),
	FOREIGN KEY (`bible_id`) REFERENCES `bibles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`language_id`) REFERENCES `bible_languages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bibles_to_rights_admins` (
	`bible_id` text NOT NULL,
	`rights_admin_id` text NOT NULL,
	PRIMARY KEY(`bible_id`, `rights_admin_id`),
	FOREIGN KEY (`bible_id`) REFERENCES `bibles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`rights_admin_id`) REFERENCES `bible_rights_admins`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bibles_to_rights_holders` (
	`bible_id` text NOT NULL,
	`rights_holder_id` text NOT NULL,
	PRIMARY KEY(`bible_id`, `rights_holder_id`),
	FOREIGN KEY (`bible_id`) REFERENCES `bibles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`rights_holder_id`) REFERENCES `bible_rights_holders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `books` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`bible_id` text NOT NULL,
	`previous_id` text,
	`next_id` text,
	`number` integer NOT NULL,
	`code` text NOT NULL,
	`abbreviation` text,
	`short_name` text NOT NULL,
	`long_name` text NOT NULL,
	FOREIGN KEY (`bible_id`) REFERENCES `bibles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chapter_bookmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`chapter_id` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chapter_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`chapter_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chapters` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`bible_id` text NOT NULL,
	`book_id` text NOT NULL,
	`previous_id` text,
	`next_id` text,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`number` integer NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`bible_id`) REFERENCES `bibles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chapters_to_source_documents` (
	`chapter_id` text NOT NULL,
	`source_document_id` text NOT NULL,
	PRIMARY KEY(`chapter_id`, `source_document_id`),
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chats` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text DEFAULT 'New Chat' NOT NULL,
	`custom_name` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `data_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`type` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`number_of_documents` integer DEFAULT 0 NOT NULL,
	`sync_schedule` text DEFAULT 'NEVER' NOT NULL,
	`last_manual_sync` text,
	`last_automatic_sync` text
);
--> statement-breakpoint
CREATE TABLE `data_sources_to_source_documents` (
	`data_source_id` text NOT NULL,
	`source_document_id` text NOT NULL,
	PRIMARY KEY(`data_source_id`, `source_document_id`),
	FOREIGN KEY (`data_source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `devotion_images` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`devotion_id` text NOT NULL,
	`url` text,
	`prompt` text,
	`negative_prompt` text,
	`caption` text,
	FOREIGN KEY (`devotion_id`) REFERENCES `devotions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `devotion_reactions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`devotion_id` text NOT NULL,
	`user_id` text NOT NULL,
	`reaction` text NOT NULL,
	`comment` text,
	FOREIGN KEY (`devotion_id`) REFERENCES `devotions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `devotions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`topic` text DEFAULT 'general' NOT NULL,
	`bible_reading` text NOT NULL,
	`summary` text NOT NULL,
	`reflection` text NOT NULL,
	`prayer` text NOT NULL,
	`dive_deeper_queries` text DEFAULT '[]' NOT NULL,
	`failed` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `devotions_to_source_documents` (
	`devotion_id` text NOT NULL,
	`source_document_id` text NOT NULL,
	`distance` real DEFAULT 0 NOT NULL,
	`distance_metric` text DEFAULT 'cosine' NOT NULL,
	PRIMARY KEY(`devotion_id`, `source_document_id`),
	FOREIGN KEY (`devotion_id`) REFERENCES `devotions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `forgotten_password_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`userId` text NOT NULL,
	`code` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `index_operations` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`data_source_id` text NOT NULL,
	`status` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`error_messages` text DEFAULT '[]' NOT NULL,
	FOREIGN KEY (`data_source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `message_reactions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`message_id` text NOT NULL,
	`user_id` text NOT NULL,
	`reaction` text NOT NULL,
	`comment` text,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`chat_id` text NOT NULL,
	`user_id` text NOT NULL,
	`origin_message_id` text,
	`content` text DEFAULT '',
	`tool_call_id` text,
	`role` text NOT NULL,
	`data` text,
	`annotations` text,
	`tool_invocations` text,
	`finish_reason` text,
	`anonymous` integer DEFAULT false NOT NULL,
	`regenerated` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`origin_message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`origin_message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `messages_to_source_documents` (
	`message_id` text NOT NULL,
	`source_document_id` text NOT NULL,
	`distance` real DEFAULT 0 NOT NULL,
	`distance_metric` text DEFAULT 'cosine' NOT NULL,
	PRIMARY KEY(`message_id`, `source_document_id`),
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `passwords` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`userId` text NOT NULL,
	`hash` text NOT NULL,
	`salt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reading_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`user_id` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `share_chat_options` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`chat_id` text NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_credits` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`user_id` text NOT NULL,
	`balance` integer NOT NULL,
	`last_reading_credit_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_generated_images` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`user_id` text NOT NULL,
	`message_id` text,
	`url` text,
	`user_prompt` text NOT NULL,
	`prompt` text,
	`negative_prompt` text,
	`search_queries` text DEFAULT '[]' NOT NULL,
	`failed` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_generated_images_reactions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`user_generated_image_id` text NOT NULL,
	`user_id` text NOT NULL,
	`reaction` text NOT NULL,
	`comment` text,
	FOREIGN KEY (`user_generated_image_id`) REFERENCES `user_generated_images`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_generated_images_to_source_documents` (
	`user_generated_image_id` text NOT NULL,
	`source_document_id` text NOT NULL,
	`distance` real DEFAULT 0 NOT NULL,
	`distance_metric` text DEFAULT 'cosine' NOT NULL,
	PRIMARY KEY(`user_generated_image_id`, `source_document_id`),
	FOREIGN KEY (`user_generated_image_id`) REFERENCES `user_generated_images`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`email` text NOT NULL,
	`first_name` text,
	`last_name` text,
	`image` text,
	`stripe_customer_id` text,
	`preferred_bible_id` text,
	FOREIGN KEY (`preferred_bible_id`) REFERENCES `bibles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users_to_roles` (
	`user_id` text NOT NULL,
	`role_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `role_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `verse_bookmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`verse_id` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`verse_id`) REFERENCES `verses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `verse_highlights` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`verse_id` text NOT NULL,
	`user_id` text NOT NULL,
	`color` text NOT NULL,
	FOREIGN KEY (`verse_id`) REFERENCES `verses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `verse_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`verse_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`verse_id`) REFERENCES `verses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `verses` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`bible_id` text NOT NULL,
	`book_id` text NOT NULL,
	`chapter_id` text NOT NULL,
	`previous_id` text,
	`next_id` text,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`number` integer NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`bible_id`) REFERENCES `bibles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
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
CREATE UNIQUE INDEX `forgotten_password_codes_user_id_idx` ON `forgotten_password_codes` (`userId`);--> statement-breakpoint
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
CREATE UNIQUE INDEX `passwords_user_id_idx` ON `passwords` (`userId`);--> statement-breakpoint
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
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_stripe_customer_id_idx` ON `users` (`stripe_customer_id`);--> statement-breakpoint
CREATE INDEX `users_preferred_bible_id_idx` ON `users` (`preferred_bible_id`);--> statement-breakpoint
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
CREATE INDEX `verses_code_idx` ON `verses` (`code`);