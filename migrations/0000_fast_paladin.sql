CREATE TABLE `bibles` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`abbreviation` text NOT NULL,
	`abbreviation_local` text NOT NULL,
	`name` text NOT NULL,
	`name_local` text NOT NULL,
	`description` text NOT NULL,
	`language_iso` text NOT NULL,
	`country_isos` text DEFAULT '[]' NOT NULL
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
	`abbreviation` text NOT NULL,
	`short_name` text NOT NULL,
	`long_name` text NOT NULL,
	FOREIGN KEY (`bible_id`) REFERENCES `bibles`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chapter_bookmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`chapter_id` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chapter_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`chapter_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE cascade ON DELETE cascade
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
	`abbreviation` text NOT NULL,
	`name` text NOT NULL,
	`number` integer NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`bible_id`) REFERENCES `bibles`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chapters_to_source_documents` (
	`chapter_id` text NOT NULL,
	`source_document_id` text NOT NULL,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chats` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`name` text DEFAULT 'New Chat' NOT NULL,
	`custom_name` integer DEFAULT false NOT NULL,
	`user_id` text NOT NULL
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
	FOREIGN KEY (`data_source_id`) REFERENCES `data_sources`(`id`) ON UPDATE cascade ON DELETE cascade
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
	FOREIGN KEY (`devotion_id`) REFERENCES `devotions`(`id`) ON UPDATE cascade ON DELETE cascade
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
	FOREIGN KEY (`devotion_id`) REFERENCES `devotions`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `devotions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`topic` text DEFAULT 'general' NOT NULL,
	`bible_reading` text NOT NULL,
	`summary` text NOT NULL,
	`reflection` text,
	`prayer` text,
	`dive_deeper_queries` text DEFAULT '[]' NOT NULL,
	`failed` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `devotions_to_source_documents` (
	`devotion_id` text NOT NULL,
	`source_document_id` text NOT NULL,
	`distance` real DEFAULT 0 NOT NULL,
	`distance_metric` text DEFAULT 'cosine' NOT NULL,
	FOREIGN KEY (`devotion_id`) REFERENCES `devotions`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `index_operations` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`status` text NOT NULL,
	`error_messages` text DEFAULT '[]' NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`data_source_id` text NOT NULL,
	FOREIGN KEY (`data_source_id`) REFERENCES `data_sources`(`id`) ON UPDATE cascade ON DELETE cascade
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
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`content` text,
	`tool_call_id` text,
	`role` text NOT NULL,
	`data` text,
	`annotations` text,
	`tool_invocations` text,
	`finish_reason` text,
	`anonymous` integer DEFAULT false NOT NULL,
	`regenerated` integer DEFAULT false NOT NULL,
	`chat_id` text NOT NULL,
	`user_id` text NOT NULL,
	`origin_message_id` text,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`origin_message_id`) REFERENCES `messages`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`origin_message_id`) REFERENCES `messages`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `messages_to_source_documents` (
	`message_id` text NOT NULL,
	`source_document_id` text NOT NULL,
	`distance` real DEFAULT 0 NOT NULL,
	`distance_metric` text DEFAULT 'cosine' NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`name` text NOT NULL,
	`permissions` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `share_chat_options` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`chat_id` text NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE cascade ON DELETE cascade
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
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE cascade ON DELETE cascade
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
	FOREIGN KEY (`user_generated_image_id`) REFERENCES `user_generated_images`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_generated_images_to_source_documents` (
	`user_generated_image_id` text NOT NULL,
	`source_document_id` text NOT NULL,
	`distance` real DEFAULT 0 NOT NULL,
	`distance_metric` text DEFAULT 'cosine' NOT NULL,
	FOREIGN KEY (`user_generated_image_id`) REFERENCES `user_generated_images`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `verse_bookmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`verse_id` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`verse_id`) REFERENCES `verses`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `verse_highlights` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`verse_id` text NOT NULL,
	`user_id` text NOT NULL,
	`color` text NOT NULL,
	FOREIGN KEY (`verse_id`) REFERENCES `verses`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `verse_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`verse_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`verse_id`) REFERENCES `verses`(`id`) ON UPDATE cascade ON DELETE cascade
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
	`abbreviation` text NOT NULL,
	`name` text NOT NULL,
	`number` integer NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`bible_id`) REFERENCES `bibles`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bibles_abbreviation_unique` ON `bibles` (`abbreviation`);--> statement-breakpoint
CREATE INDEX `bibles_abbreviation` ON `bibles` (`abbreviation`);--> statement-breakpoint
CREATE INDEX `bibles_language_iso` ON `bibles` (`language_iso`);--> statement-breakpoint
CREATE INDEX `bibles_country_isos` ON `bibles` (`country_isos`);--> statement-breakpoint
CREATE INDEX `books_abbreviation` ON `books` (`abbreviation`);--> statement-breakpoint
CREATE INDEX `books_short_name` ON `books` (`short_name`);--> statement-breakpoint
CREATE INDEX `books_long_name` ON `books` (`long_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `chapter_bookmarks_user_chapter_key` ON `chapter_bookmarks` (`user_id`,`chapter_id`);--> statement-breakpoint
CREATE INDEX `chapter_bookmarks_chapter_id` ON `chapter_bookmarks` (`chapter_id`);--> statement-breakpoint
CREATE INDEX `chapter_bookmarks_user_id` ON `chapter_bookmarks` (`user_id`);--> statement-breakpoint
CREATE INDEX `chapter_notes_chapter_id` ON `chapter_notes` (`chapter_id`);--> statement-breakpoint
CREATE INDEX `chapter_notes_user_id` ON `chapter_notes` (`user_id`);--> statement-breakpoint
CREATE INDEX `chapters_name` ON `chapters` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `chapter_source_document_key` ON `chapters_to_source_documents` (`chapter_id`,`source_document_id`);--> statement-breakpoint
CREATE INDEX `chat_name` ON `chats` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `data_sources_name_key` ON `data_sources` (`name`);--> statement-breakpoint
CREATE INDEX `data_sources_type` ON `data_sources` (`type`);--> statement-breakpoint
CREATE UNIQUE INDEX `data_source_source_document_key` ON `data_sources_to_source_documents` (`data_source_id`,`source_document_id`);--> statement-breakpoint
CREATE INDEX `devotion_images_devotion_id` ON `devotion_images` (`devotion_id`);--> statement-breakpoint
CREATE INDEX `devotion_reactions_devotion_id` ON `devotion_reactions` (`devotion_id`);--> statement-breakpoint
CREATE INDEX `devotions_created_at_idx` ON `devotions` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `devotion_source_document_key` ON `devotions_to_source_documents` (`devotion_id`,`source_document_id`);--> statement-breakpoint
CREATE INDEX `index_operation_status` ON `index_operations` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `message_reaction_key` ON `message_reactions` (`message_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `role` ON `messages` (`role`);--> statement-breakpoint
CREATE INDEX `content` ON `messages` (`content`);--> statement-breakpoint
CREATE INDEX `chat_id` ON `messages` (`chat_id`);--> statement-breakpoint
CREATE INDEX `user_id` ON `messages` (`user_id`);--> statement-breakpoint
CREATE INDEX `origin_message_id` ON `messages` (`origin_message_id`);--> statement-breakpoint
CREATE INDEX `anonymous` ON `messages` (`anonymous`);--> statement-breakpoint
CREATE UNIQUE INDEX `message_source_document_key` ON `messages_to_source_documents` (`message_id`,`source_document_id`);--> statement-breakpoint
CREATE INDEX `chat_share_options_chat_id` ON `share_chat_options` (`chat_id`);--> statement-breakpoint
CREATE INDEX `user_generated_images_user_id` ON `user_generated_images` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_generated_images_message_id` ON `user_generated_images` (`message_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_generated_image_reaction_key` ON `user_generated_images_reactions` (`user_generated_image_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_generated_image_source_document_key` ON `user_generated_images_to_source_documents` (`user_generated_image_id`,`source_document_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `verse_bookmarks_user_verse_key` ON `verse_bookmarks` (`user_id`,`verse_id`);--> statement-breakpoint
CREATE INDEX `verse_bookmarks_verse_id` ON `verse_bookmarks` (`verse_id`);--> statement-breakpoint
CREATE INDEX `verse_bookmarks_user_id` ON `verse_bookmarks` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `verse_highlights_user_verse_key` ON `verse_highlights` (`user_id`,`verse_id`);--> statement-breakpoint
CREATE INDEX `verse_highlights_verse_id` ON `verse_highlights` (`verse_id`);--> statement-breakpoint
CREATE INDEX `verse_highlights_user_id` ON `verse_highlights` (`user_id`);--> statement-breakpoint
CREATE INDEX `verse_notes_verse_id` ON `verse_notes` (`verse_id`);--> statement-breakpoint
CREATE INDEX `verse_notes_user_id` ON `verse_notes` (`user_id`);--> statement-breakpoint
CREATE INDEX `verses_name` ON `verses` (`name`);