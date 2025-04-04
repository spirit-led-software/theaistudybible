PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_chats` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text DEFAULT 'New Chat' NOT NULL,
	`custom_name` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_chats`("id", "created_at", "updated_at", "user_id", "name", "custom_name") SELECT "id", "created_at", "updated_at", "user_id", "name", "custom_name" FROM `chats`;--> statement-breakpoint
DROP TABLE `chats`;--> statement-breakpoint
ALTER TABLE `__new_chats` RENAME TO `chats`;--> statement-breakpoint
CREATE INDEX `chats_user_id_idx` ON `chats` (`user_id`);--> statement-breakpoint
CREATE INDEX `chats_name_idx` ON `chats` (`name`);--> statement-breakpoint
CREATE TABLE `__new_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`chat_id` text NOT NULL,
	`origin_message_id` text,
	`user_id` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`reasoning` text,
	`tool_call_id` text,
	`role` text NOT NULL,
	`data` text,
	`annotations` text,
	`tool_invocations` text,
	`finish_reason` text,
	`attachments` text,
	`parts` text,
	`anonymous` integer DEFAULT false NOT NULL,
	`regenerated` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`origin_message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`origin_message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_messages`("id", "created_at", "updated_at", "chat_id", "origin_message_id", "user_id", "content", "reasoning", "tool_call_id", "role", "data", "annotations", "tool_invocations", "finish_reason", "attachments", "parts", "anonymous", "regenerated") SELECT "id", "created_at", "updated_at", "chat_id", "origin_message_id", "user_id", "content", "reasoning", "tool_call_id", "role", "data", "annotations", "tool_invocations", "finish_reason", "attachments", "parts", "anonymous", "regenerated" FROM `messages`;--> statement-breakpoint
DROP TABLE `messages`;--> statement-breakpoint
ALTER TABLE `__new_messages` RENAME TO `messages`;--> statement-breakpoint
CREATE INDEX `messages_chat_id_idx` ON `messages` (`chat_id`);--> statement-breakpoint
CREATE INDEX `messages_user_id_idx` ON `messages` (`user_id`);--> statement-breakpoint
CREATE INDEX `messages_origin_message_id_idx` ON `messages` (`origin_message_id`);--> statement-breakpoint
CREATE INDEX `messages_role_idx` ON `messages` (`role`);--> statement-breakpoint
CREATE INDEX `messages_content_idx` ON `messages` (`content`);--> statement-breakpoint
CREATE INDEX `messages_finish_reason_idx` ON `messages` (`finish_reason`);--> statement-breakpoint
CREATE TABLE `__new_chapter_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`bible_abbreviation` text NOT NULL,
	`chapter_code` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`bible_abbreviation`) REFERENCES `bibles`(`abbreviation`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`bible_abbreviation`,`chapter_code`) REFERENCES `chapters`(`bible_abbreviation`,`code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_chapter_notes`("id", "created_at", "updated_at", "bible_abbreviation", "chapter_code", "user_id", "content") SELECT lower(hex(randomblob(16))), "created_at", "updated_at", "bible_abbreviation", "chapter_code", "user_id", "content" FROM `chapter_notes`;--> statement-breakpoint
DROP TABLE `chapter_notes`;--> statement-breakpoint
ALTER TABLE `__new_chapter_notes` RENAME TO `chapter_notes`;--> statement-breakpoint
CREATE INDEX `chapter_notes_bible_abbreviation_idx` ON `chapter_notes` (`bible_abbreviation`);--> statement-breakpoint
CREATE INDEX `chapter_notes_chapter_code_idx` ON `chapter_notes` (`chapter_code`);--> statement-breakpoint
CREATE INDEX `chapter_notes_user_id_idx` ON `chapter_notes` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_verse_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`bible_abbreviation` text NOT NULL,
	`verse_code` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`bible_abbreviation`) REFERENCES `bibles`(`abbreviation`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`bible_abbreviation`,`verse_code`) REFERENCES `verses`(`bible_abbreviation`,`code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_verse_notes`("id", "created_at", "updated_at", "bible_abbreviation", "verse_code", "user_id", "content") SELECT lower(hex(randomblob(16))), "created_at", "updated_at", "bible_abbreviation", "verse_code", "user_id", "content" FROM `verse_notes`;--> statement-breakpoint
DROP TABLE `verse_notes`;--> statement-breakpoint
ALTER TABLE `__new_verse_notes` RENAME TO `verse_notes`;--> statement-breakpoint
CREATE INDEX `verse_notes_bible_abbreviation_idx` ON `verse_notes` (`bible_abbreviation`);--> statement-breakpoint
CREATE INDEX `verse_notes_verse_code_idx` ON `verse_notes` (`verse_code`);--> statement-breakpoint
CREATE INDEX `verse_notes_user_id_idx` ON `verse_notes` (`user_id`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
