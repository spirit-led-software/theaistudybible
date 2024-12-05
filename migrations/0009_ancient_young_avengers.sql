DROP TABLE `source_documents`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_chapters_to_source_documents` (
	`chapter_id` text NOT NULL,
	`source_document_id` text NOT NULL,
	PRIMARY KEY(`chapter_id`, `source_document_id`),
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_chapters_to_source_documents`("chapter_id", "source_document_id") SELECT "chapter_id", "source_document_id" FROM `chapters_to_source_documents`;--> statement-breakpoint
DROP TABLE `chapters_to_source_documents`;--> statement-breakpoint
ALTER TABLE `__new_chapters_to_source_documents` RENAME TO `chapters_to_source_documents`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `chapters_to_source_documents_chapter_id_idx` ON `chapters_to_source_documents` (`chapter_id`);--> statement-breakpoint
CREATE INDEX `chapters_to_source_documents_source_document_id_idx` ON `chapters_to_source_documents` (`source_document_id`);--> statement-breakpoint
CREATE TABLE `__new_data_sources_to_source_documents` (
	`data_source_id` text NOT NULL,
	`source_document_id` text NOT NULL,
	PRIMARY KEY(`data_source_id`, `source_document_id`),
	FOREIGN KEY (`data_source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_data_sources_to_source_documents`("data_source_id", "source_document_id") SELECT "data_source_id", "source_document_id" FROM `data_sources_to_source_documents`;--> statement-breakpoint
DROP TABLE `data_sources_to_source_documents`;--> statement-breakpoint
ALTER TABLE `__new_data_sources_to_source_documents` RENAME TO `data_sources_to_source_documents`;--> statement-breakpoint
CREATE INDEX `data_sources_to_source_documents_data_source_id_idx` ON `data_sources_to_source_documents` (`data_source_id`);--> statement-breakpoint
CREATE INDEX `data_sources_to_source_documents_source_document_id_idx` ON `data_sources_to_source_documents` (`source_document_id`);--> statement-breakpoint
CREATE TABLE `__new_devotions_to_source_documents` (
	`devotion_id` text NOT NULL,
	`source_document_id` text NOT NULL,
	`distance` real DEFAULT 0 NOT NULL,
	`distance_metric` text DEFAULT 'cosine' NOT NULL,
	PRIMARY KEY(`devotion_id`, `source_document_id`),
	FOREIGN KEY (`devotion_id`) REFERENCES `devotions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_devotions_to_source_documents`("devotion_id", "source_document_id", "distance", "distance_metric") SELECT "devotion_id", "source_document_id", "distance", "distance_metric" FROM `devotions_to_source_documents`;--> statement-breakpoint
DROP TABLE `devotions_to_source_documents`;--> statement-breakpoint
ALTER TABLE `__new_devotions_to_source_documents` RENAME TO `devotions_to_source_documents`;--> statement-breakpoint
CREATE INDEX `devotions_to_source_documents_devotion_id_idx` ON `devotions_to_source_documents` (`devotion_id`);--> statement-breakpoint
CREATE INDEX `devotions_to_source_documents_source_document_id_idx` ON `devotions_to_source_documents` (`source_document_id`);--> statement-breakpoint
CREATE TABLE `__new_messages_to_source_documents` (
	`message_id` text NOT NULL,
	`source_document_id` text NOT NULL,
	`distance` real DEFAULT 0 NOT NULL,
	`distance_metric` text DEFAULT 'cosine' NOT NULL,
	PRIMARY KEY(`message_id`, `source_document_id`),
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_messages_to_source_documents`("message_id", "source_document_id", "distance", "distance_metric") SELECT "message_id", "source_document_id", "distance", "distance_metric" FROM `messages_to_source_documents`;--> statement-breakpoint
DROP TABLE `messages_to_source_documents`;--> statement-breakpoint
ALTER TABLE `__new_messages_to_source_documents` RENAME TO `messages_to_source_documents`;--> statement-breakpoint
CREATE INDEX `messages_to_source_documents_message_id_idx` ON `messages_to_source_documents` (`message_id`);--> statement-breakpoint
CREATE INDEX `messages_to_source_documents_source_document_id_idx` ON `messages_to_source_documents` (`source_document_id`);--> statement-breakpoint
CREATE TABLE `__new_user_generated_images_to_source_documents` (
	`user_generated_image_id` text NOT NULL,
	`source_document_id` text NOT NULL,
	`distance` real DEFAULT 0 NOT NULL,
	`distance_metric` text DEFAULT 'cosine' NOT NULL,
	PRIMARY KEY(`user_generated_image_id`, `source_document_id`),
	FOREIGN KEY (`user_generated_image_id`) REFERENCES `user_generated_images`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_user_generated_images_to_source_documents`("user_generated_image_id", "source_document_id", "distance", "distance_metric") SELECT "user_generated_image_id", "source_document_id", "distance", "distance_metric" FROM `user_generated_images_to_source_documents`;--> statement-breakpoint
DROP TABLE `user_generated_images_to_source_documents`;--> statement-breakpoint
ALTER TABLE `__new_user_generated_images_to_source_documents` RENAME TO `user_generated_images_to_source_documents`;--> statement-breakpoint
CREATE INDEX `user_generated_images_to_source_documents_user_generated_image_id_idx` ON `user_generated_images_to_source_documents` (`user_generated_image_id`);--> statement-breakpoint
CREATE INDEX `user_generated_images_to_source_documents_source_document_id_idx` ON `user_generated_images_to_source_documents` (`source_document_id`);