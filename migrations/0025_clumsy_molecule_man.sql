PRAGMA foreign_keys = OFF;
--> statement-breakpoint
CREATE TABLE `__new_verse_bookmarks` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`bible_abbreviation` text NOT NULL,
	`verse_code` text NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`bible_abbreviation`, `verse_code`, `user_id`),
	FOREIGN KEY (`bible_abbreviation`) REFERENCES `bibles`(`abbreviation`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`verse_code`) REFERENCES `verses`(`code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_verse_bookmarks`(
		"created_at",
		"updated_at",
		"bible_abbreviation",
		"verse_code",
		"user_id"
	)
SELECT "verse_bookmarks"."created_at" AS `created_at`,
	"verse_bookmarks"."updated_at" AS `updated_at`,
	"bibles"."abbreviation" AS `bible_abbreviation`,
	"verses"."code" AS `verse_code`,
	"verse_bookmarks"."user_id" AS `user_id`
FROM `verse_bookmarks`
	JOIN `verses` ON `verses`.`id` = `verse_bookmarks`.`verse_id`
	JOIN `users` ON `users`.`id` = `verse_bookmarks`.`user_id`
	JOIN `bibles` ON `bibles`.`id` = `verses`.`bible_id`;
--> statement-breakpoint
DROP TABLE `verse_bookmarks`;
--> statement-breakpoint
ALTER TABLE `__new_verse_bookmarks`
	RENAME TO `verse_bookmarks`;
--> statement-breakpoint
CREATE INDEX `verse_bookmarks_bible_abbreviation_idx` ON `verse_bookmarks` (`bible_abbreviation`);
--> statement-breakpoint
CREATE INDEX `verse_bookmarks_verse_code_idx` ON `verse_bookmarks` (`verse_code`);
--> statement-breakpoint
CREATE INDEX `verse_bookmarks_user_id_idx` ON `verse_bookmarks` (`user_id`);
--> statement-breakpoint
CREATE TABLE `__new_verse_highlights` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`bible_abbreviation` text NOT NULL,
	`verse_code` text NOT NULL,
	`user_id` text NOT NULL,
	`color` text NOT NULL,
	PRIMARY KEY(`bible_abbreviation`, `verse_code`, `user_id`),
	FOREIGN KEY (`bible_abbreviation`) REFERENCES `bibles`(`abbreviation`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`verse_code`) REFERENCES `verses`(`code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_verse_highlights`(
		"created_at",
		"updated_at",
		"bible_abbreviation",
		"verse_code",
		"user_id",
		"color"
	)
SELECT "verse_highlights"."created_at" AS `created_at`,
	"verse_highlights"."updated_at" AS `updated_at`,
	"bibles"."abbreviation" AS `bible_abbreviation`,
	"verses"."code" AS `verse_code`,
	"verse_highlights"."user_id" AS `user_id`,
	"verse_highlights"."color" AS `color`
FROM `verse_highlights`
	JOIN `verses` ON `verses`.`id` = `verse_highlights`.`verse_id`
	JOIN `users` ON `users`.`id` = `verse_highlights`.`user_id`
	JOIN `bibles` ON `bibles`.`id` = `verses`.`bible_id`;
--> statement-breakpoint
DROP TABLE `verse_highlights`;
--> statement-breakpoint
ALTER TABLE `__new_verse_highlights`
	RENAME TO `verse_highlights`;
--> statement-breakpoint
CREATE INDEX `verse_highlights_bible_abbreviation_idx` ON `verse_highlights` (`bible_abbreviation`);
--> statement-breakpoint
CREATE INDEX `verse_highlights_verse_code_idx` ON `verse_highlights` (`verse_code`);
--> statement-breakpoint
CREATE INDEX `verse_highlights_user_id_idx` ON `verse_highlights` (`user_id`);
--> statement-breakpoint
CREATE TABLE `__new_verse_notes` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`bible_abbreviation` text NOT NULL,
	`verse_code` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	PRIMARY KEY(`bible_abbreviation`, `verse_code`, `user_id`),
	FOREIGN KEY (`bible_abbreviation`) REFERENCES `bibles`(`abbreviation`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`verse_code`) REFERENCES `verses`(`code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_verse_notes`(
		"created_at",
		"updated_at",
		"bible_abbreviation",
		"verse_code",
		"user_id",
		"content"
	)
SELECT "verse_notes"."created_at" AS `created_at`,
	"verse_notes"."updated_at" AS `updated_at`,
	"bibles"."abbreviation" AS `bible_abbreviation`,
	"verses"."code" AS `verse_code`,
	"verse_notes"."user_id" AS `user_id`,
	"verse_notes"."content" AS `content`
FROM `verse_notes`
	JOIN `verses` ON `verses`.`id` = `verse_notes`.`verse_id`
	JOIN `users` ON `users`.`id` = `verse_notes`.`user_id`
	JOIN `bibles` ON `bibles`.`id` = `verses`.`bible_id`;
--> statement-breakpoint
DROP TABLE `verse_notes`;
--> statement-breakpoint
ALTER TABLE `__new_verse_notes`
	RENAME TO `verse_notes`;
--> statement-breakpoint
CREATE INDEX `verse_notes_bible_abbreviation_idx` ON `verse_notes` (`bible_abbreviation`);
--> statement-breakpoint
CREATE INDEX `verse_notes_verse_code_idx` ON `verse_notes` (`verse_code`);
--> statement-breakpoint
CREATE INDEX `verse_notes_user_id_idx` ON `verse_notes` (`user_id`);
--> statement-breakpoint
CREATE TABLE `__new_verses` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`bible_abbreviation` text NOT NULL,
	`book_code` text NOT NULL,
	`chapter_code` text NOT NULL,
	`previous_code` text,
	`next_code` text,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`number` integer NOT NULL,
	`content` text NOT NULL,
	PRIMARY KEY(`bible_abbreviation`, `code`),
	FOREIGN KEY (`bible_abbreviation`) REFERENCES `bibles`(`abbreviation`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`book_code`) REFERENCES `books`(`code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`chapter_code`) REFERENCES `chapters`(`code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_verses`(
		"created_at",
		"updated_at",
		"bible_abbreviation",
		"book_code",
		"chapter_code",
		"previous_code",
		"next_code",
		"code",
		"name",
		"number",
		"content"
	)
SELECT "verses"."created_at" AS `created_at`,
	"verses"."updated_at" AS `updated_at`,
	"bibles"."abbreviation" AS `bible_abbreviation`,
	"books"."code" AS `book_code`,
	"chapters"."code" AS `chapter_code`,
	"previous_chapters"."code" AS `previous_code`,
	"next_chapters"."code" AS `next_code`,
	"verses"."code" AS `code`,
	"verses"."name" AS `name`,
	"verses"."number" AS `number`,
	"verses"."content" AS `content`
FROM `verses`
	JOIN `bibles` ON `bibles`.`id` = `verses`.`bible_id`
	JOIN `books` ON `books`.`id` = `verses`.`book_id`
	JOIN `chapters` ON `chapters`.`id` = `verses`.`chapter_id`
	JOIN `chapters` AS `previous_chapters` ON `previous_chapters`.`id` = `chapters`.`previous_id`
	JOIN `chapters` AS `next_chapters` ON `next_chapters`.`id` = `chapters`.`next_id`;
--> statement-breakpoint
DROP TABLE `verses`;
--> statement-breakpoint
ALTER TABLE `__new_verses`
	RENAME TO `verses`;
--> statement-breakpoint
CREATE INDEX `verses_bible_abbreviation_idx` ON `verses` (`bible_abbreviation`);
--> statement-breakpoint
CREATE INDEX `verses_book_code_idx` ON `verses` (`book_code`);
--> statement-breakpoint
CREATE INDEX `verses_chapter_code_idx` ON `verses` (`chapter_code`);
--> statement-breakpoint
CREATE INDEX `verses_previous_code_idx` ON `verses` (`previous_code`);
--> statement-breakpoint
CREATE INDEX `verses_next_code_idx` ON `verses` (`next_code`);
--> statement-breakpoint
CREATE INDEX `verses_code_idx` ON `verses` (`code`);
--> statement-breakpoint
CREATE INDEX `verses_name_idx` ON `verses` (`name`);
--> statement-breakpoint
CREATE INDEX `verses_number_idx` ON `verses` (`number`);
--> statement-breakpoint
CREATE TABLE `__new_chapter_bookmarks` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`bible_abbreviation` text NOT NULL,
	`chapter_code` text NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`bible_abbreviation`, `chapter_code`, `user_id`),
	FOREIGN KEY (`bible_abbreviation`) REFERENCES `bibles`(`abbreviation`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`chapter_code`) REFERENCES `chapters`(`code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_chapter_bookmarks`(
		"created_at",
		"updated_at",
		"bible_abbreviation",
		"chapter_code",
		"user_id"
	)
SELECT "chapter_bookmarks"."created_at" AS `created_at`,
	"chapter_bookmarks"."updated_at" AS `updated_at`,
	"bibles"."abbreviation" AS `bible_abbreviation`,
	"chapters"."code" AS `chapter_code`,
	"chapter_bookmarks"."user_id" AS `user_id`
FROM `chapter_bookmarks`
	JOIN `bibles` ON `bibles`.`id` = `chapter_bookmarks`.`bible_id`
	JOIN `chapters` ON `chapters`.`id` = `chapter_bookmarks`.`chapter_id`;
--> statement-breakpoint
DROP TABLE `chapter_bookmarks`;
--> statement-breakpoint
ALTER TABLE `__new_chapter_bookmarks`
	RENAME TO `chapter_bookmarks`;
--> statement-breakpoint
CREATE INDEX `chapter_bookmarks_bible_abbreviation_idx` ON `chapter_bookmarks` (`bible_abbreviation`);
--> statement-breakpoint
CREATE INDEX `chapter_bookmarks_chapter_code_idx` ON `chapter_bookmarks` (`chapter_code`);
--> statement-breakpoint
CREATE INDEX `chapter_bookmarks_user_id_idx` ON `chapter_bookmarks` (`user_id`);
--> statement-breakpoint
CREATE TABLE `__new_chapter_notes` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`bible_abbreviation` text NOT NULL,
	`chapter_code` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	PRIMARY KEY(`bible_abbreviation`, `chapter_code`, `user_id`),
	FOREIGN KEY (`bible_abbreviation`) REFERENCES `bibles`(`abbreviation`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`chapter_code`) REFERENCES `chapters`(`code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_chapter_notes`(
		"created_at",
		"updated_at",
		"bible_abbreviation",
		"chapter_code",
		"user_id",
		"content"
	)
SELECT "chapter_notes"."created_at" AS `created_at`,
	"chapter_notes"."updated_at" AS `updated_at`,
	"bibles"."abbreviation" AS `bible_abbreviation`,
	"chapters"."code" AS `chapter_code`,
	"chapter_notes"."user_id" AS `user_id`,
	"chapter_notes"."content" AS `content`
FROM `chapter_notes`
	JOIN `bibles` ON `bibles`.`id` = `chapter_notes`.`bible_id`
	JOIN `chapters` ON `chapters`.`id` = `chapter_notes`.`chapter_id`;
--> statement-breakpoint
DROP TABLE `chapter_notes`;
--> statement-breakpoint
ALTER TABLE `__new_chapter_notes`
	RENAME TO `chapter_notes`;
--> statement-breakpoint
CREATE INDEX `chapter_notes_bible_abbreviation_idx` ON `chapter_notes` (`bible_abbreviation`);
--> statement-breakpoint
CREATE INDEX `chapter_notes_chapter_code_idx` ON `chapter_notes` (`chapter_code`);
--> statement-breakpoint
CREATE INDEX `chapter_notes_user_id_idx` ON `chapter_notes` (`user_id`);
--> statement-breakpoint
CREATE TABLE `__new_chapters_to_source_documents` (
	`bible_abbreviation` text NOT NULL,
	`chapter_code` text NOT NULL,
	`source_document_id` text NOT NULL,
	PRIMARY KEY(
		`bible_abbreviation`,
		`chapter_code`,
		`source_document_id`
	),
	FOREIGN KEY (`bible_abbreviation`) REFERENCES `bibles`(`abbreviation`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`chapter_code`) REFERENCES `chapters`(`code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_document_id`) REFERENCES `source_documents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_chapters_to_source_documents`(
		"bible_abbreviation",
		"chapter_code",
		"source_document_id"
	)
SELECT "bibles"."abbreviation" AS `bible_abbreviation`,
	"chapters"."code" AS `chapter_code`,
	"source_documents"."id" AS `source_document_id`
FROM `chapters_to_source_documents`
	JOIN `chapters` ON `chapters`.`id` = `chapters_to_source_documents`.`chapter_id`
	JOIN `source_documents` ON `source_documents`.`id` = `chapters_to_source_documents`.`source_document_id`
	JOIN `bibles` ON `bibles`.`id` = `chapters`.`bible_id`;
--> statement-breakpoint
DROP TABLE `chapters_to_source_documents`;
--> statement-breakpoint
ALTER TABLE `__new_chapters_to_source_documents`
	RENAME TO `chapters_to_source_documents`;
--> statement-breakpoint
CREATE INDEX `chapters_to_source_documents_bible_abbreviation_idx` ON `chapters_to_source_documents` (`bible_abbreviation`);
--> statement-breakpoint
CREATE INDEX `chapters_to_source_documents_chapter_code_idx` ON `chapters_to_source_documents` (`chapter_code`);
--> statement-breakpoint
CREATE INDEX `chapters_to_source_documents_source_document_id_idx` ON `chapters_to_source_documents` (`source_document_id`);
--> statement-breakpoint
CREATE TABLE `__new_chapters` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`bible_abbreviation` text NOT NULL,
	`book_code` text NOT NULL,
	`previous_code` text,
	`next_code` text,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`number` integer NOT NULL,
	`content` text NOT NULL,
	PRIMARY KEY(`bible_abbreviation`, `code`),
	FOREIGN KEY (`bible_abbreviation`) REFERENCES `bibles`(`abbreviation`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`book_code`) REFERENCES `books`(`code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_chapters`(
		"created_at",
		"updated_at",
		"bible_abbreviation",
		"book_code",
		"previous_code",
		"next_code",
		"code",
		"name",
		"number",
		"content"
	)
SELECT "chapters"."created_at" AS `created_at`,
	"chapters"."updated_at" AS `updated_at`,
	"bibles"."abbreviation" AS `bible_abbreviation`,
	"books"."code" AS `book_code`,
	"previous_chapters"."code" AS `previous_code`,
	"next_chapters"."code" AS `next_code`,
	"chapters"."code" AS `code`,
	"chapters"."name" AS `name`,
	"chapters"."number" AS `number`,
	"chapters"."content" AS `content`
FROM `chapters`
	JOIN `bibles` ON `bibles`.`id` = `chapters`.`bible_id`
	JOIN `books` ON `books`.`id` = `chapters`.`book_id`
	JOIN `chapters` AS `previous_chapters` ON `previous_chapters`.`id` = `chapters`.`previous_id`
	JOIN `chapters` AS `next_chapters` ON `next_chapters`.`id` = `chapters`.`next_id`;
--> statement-breakpoint
DROP TABLE `chapters`;
--> statement-breakpoint
ALTER TABLE `__new_chapters`
	RENAME TO `chapters`;
--> statement-breakpoint
CREATE INDEX `chapters_bible_abbreviation_idx` ON `chapters` (`bible_abbreviation`);
--> statement-breakpoint
CREATE INDEX `chapters_book_code_idx` ON `chapters` (`book_code`);
--> statement-breakpoint
CREATE INDEX `chapters_previous_code_idx` ON `chapters` (`previous_code`);
--> statement-breakpoint
CREATE INDEX `chapters_next_code_idx` ON `chapters` (`next_code`);
--> statement-breakpoint
CREATE INDEX `chapters_code_idx` ON `chapters` (`code`);
--> statement-breakpoint
CREATE INDEX `chapters_name_idx` ON `chapters` (`name`);
--> statement-breakpoint
CREATE INDEX `chapters_number_idx` ON `chapters` (`number`);
--> statement-breakpoint
CREATE TABLE `__new_books` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`bible_abbreviation` text NOT NULL,
	`previous_code` text,
	`next_code` text,
	`number` integer NOT NULL,
	`code` text NOT NULL,
	`abbreviation` text,
	`short_name` text NOT NULL,
	`long_name` text NOT NULL,
	PRIMARY KEY(`bible_abbreviation`, `code`),
	FOREIGN KEY (`bible_abbreviation`) REFERENCES `bibles`(`abbreviation`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_books`(
		"created_at",
		"updated_at",
		"bible_abbreviation",
		"previous_code",
		"next_code",
		"number",
		"code",
		"abbreviation",
		"short_name",
		"long_name"
	)
SELECT "books"."created_at" AS `created_at`,
	"books"."updated_at" AS `updated_at`,
	"bibles"."abbreviation" AS `bible_abbreviation`,
	"previous_books"."code" AS `previous_code`,
	"next_books"."code" AS `next_code`,
	"books"."number" AS `number`,
	"books"."code" AS `code`,
	"books"."abbreviation" AS `abbreviation`,
	"books"."short_name" AS `short_name`,
	"books"."long_name" AS `long_name`
FROM `books`
	JOIN `bibles` ON `bibles`.`id` = `books`.`bible_id`
	JOIN `books` AS `previous_books` ON `previous_books`.`id` = `books`.`previous_id`
	JOIN `books` AS `next_books` ON `next_books`.`id` = `books`.`next_id`;
--> statement-breakpoint
DROP TABLE `books`;
--> statement-breakpoint
ALTER TABLE `__new_books`
	RENAME TO `books`;
--> statement-breakpoint
CREATE INDEX `books_bible_abbreviation_idx` ON `books` (`bible_abbreviation`);
--> statement-breakpoint
CREATE INDEX `books_previous_code_idx` ON `books` (`previous_code`);
--> statement-breakpoint
CREATE INDEX `books_next_code_idx` ON `books` (`next_code`);
--> statement-breakpoint
CREATE INDEX `books_number_idx` ON `books` (`number`);
--> statement-breakpoint
CREATE INDEX `books_code_idx` ON `books` (`code`);
--> statement-breakpoint
CREATE INDEX `books_abbreviation_idx` ON `books` (`abbreviation`);
--> statement-breakpoint
CREATE TABLE `__new_bibles_to_contributors` (
	`bible_abbreviation` text NOT NULL,
	`contributor_uid` text NOT NULL,
	PRIMARY KEY(`bible_abbreviation`, `contributor_uid`),
	FOREIGN KEY (`bible_abbreviation`) REFERENCES `bibles`(`abbreviation`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contributor_uid`) REFERENCES `bible_contributors`(`uid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_bibles_to_contributors`("bible_abbreviation", "contributor_uid")
SELECT "bibles"."abbreviation" AS `bible_abbreviation`,
	"bible_contributors"."uid" AS `contributor_uid`
FROM `bibles_to_contributors`
	JOIN `bible_contributors` ON `bible_contributors`.`id` = `bibles_to_contributors`.`contributor_id`
	JOIN `bibles` ON `bibles`.`id` = `bibles_to_contributors`.`bible_id`;
--> statement-breakpoint
DROP TABLE `bibles_to_contributors`;
--> statement-breakpoint
ALTER TABLE `__new_bibles_to_contributors`
	RENAME TO `bibles_to_contributors`;
--> statement-breakpoint
CREATE INDEX `bibles_to_contributors_bible_abbreviation_idx` ON `bibles_to_contributors` (`bible_abbreviation`);
--> statement-breakpoint
CREATE INDEX `bibles_to_contributors_contributor_uid_idx` ON `bibles_to_contributors` (`contributor_uid`);
--> statement-breakpoint
CREATE TABLE `__new_bible_contributors` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`uid` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`content` integer DEFAULT false NOT NULL,
	`publication` integer DEFAULT false NOT NULL,
	`management` integer DEFAULT false NOT NULL,
	`finance` integer DEFAULT false NOT NULL,
	`qa` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_bible_contributors`(
		"created_at",
		"updated_at",
		"uid",
		"name",
		"content",
		"publication",
		"management",
		"finance",
		"qa"
	)
SELECT "created_at",
	"updated_at",
	"uid",
	"name",
	"content",
	"publication",
	"management",
	"finance",
	"qa"
FROM `bible_contributors`;
--> statement-breakpoint
DROP TABLE `bible_contributors`;
--> statement-breakpoint
ALTER TABLE `__new_bible_contributors`
	RENAME TO `bible_contributors`;
--> statement-breakpoint
CREATE INDEX `bible_contributors_name_idx` ON `bible_contributors` (`name`);
--> statement-breakpoint
CREATE TABLE `__new_bibles_to_countries` (
	`bible_abbreviation` text NOT NULL,
	`country_iso` text NOT NULL,
	PRIMARY KEY(`bible_abbreviation`, `country_iso`),
	FOREIGN KEY (`bible_abbreviation`) REFERENCES `bibles`(`abbreviation`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`country_iso`) REFERENCES `bible_countries`(`iso`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_bibles_to_countries`("bible_abbreviation", "country_iso")
SELECT "bibles"."abbreviation" AS `bible_abbreviation`,
	"bible_countries"."iso" AS `country_iso`
FROM `bibles_to_countries`
	JOIN `bible_countries` ON `bible_countries`.`id` = `bibles_to_countries`.`country_id`
	JOIN `bibles` ON `bibles`.`id` = `bibles_to_countries`.`bible_id`;
--> statement-breakpoint
DROP TABLE `bibles_to_countries`;
--> statement-breakpoint
ALTER TABLE `__new_bibles_to_countries`
	RENAME TO `bibles_to_countries`;
--> statement-breakpoint
CREATE INDEX `bibles_to_countries_bible_abbreviation_idx` ON `bibles_to_countries` (`bible_abbreviation`);
--> statement-breakpoint
CREATE INDEX `bibles_to_countries_country_iso_idx` ON `bibles_to_countries` (`country_iso`);
--> statement-breakpoint
CREATE TABLE `__new_bible_countries` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`iso` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_bible_countries`("created_at", "updated_at", "iso", "name")
SELECT "created_at",
	"updated_at",
	"iso",
	"name"
FROM `bible_countries`;
--> statement-breakpoint
DROP TABLE `bible_countries`;
--> statement-breakpoint
ALTER TABLE `__new_bible_countries`
	RENAME TO `bible_countries`;
--> statement-breakpoint
CREATE INDEX `bible_countries_name_idx` ON `bible_countries` (`name`);
--> statement-breakpoint
CREATE TABLE `__new_bibles_to_languages` (
	`bible_abbreviation` text NOT NULL,
	`language_iso` text NOT NULL,
	PRIMARY KEY(`bible_abbreviation`, `language_iso`),
	FOREIGN KEY (`bible_abbreviation`) REFERENCES `bibles`(`abbreviation`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`language_iso`) REFERENCES `bible_languages`(`iso`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_bibles_to_languages`("bible_abbreviation", "language_iso")
SELECT "bibles"."abbreviation" AS `bible_abbreviation`,
	"bible_languages"."iso" AS `language_iso`
FROM `bibles_to_languages`
	JOIN `bible_languages` ON `bible_languages`.`id` = `bibles_to_languages`.`language_id`
	JOIN `bibles` ON `bibles`.`id` = `bibles_to_languages`.`bible_id`;
--> statement-breakpoint
DROP TABLE `bibles_to_languages`;
--> statement-breakpoint
ALTER TABLE `__new_bibles_to_languages`
	RENAME TO `bibles_to_languages`;
--> statement-breakpoint
CREATE INDEX `bibles_to_languages_bible_abbreviation_idx` ON `bibles_to_languages` (`bible_abbreviation`);
--> statement-breakpoint
CREATE INDEX `bibles_to_languages_language_iso_idx` ON `bibles_to_languages` (`language_iso`);
--> statement-breakpoint
CREATE TABLE `__new_bible_languages` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`iso` text PRIMARY KEY NOT NULL,
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
INSERT INTO `__new_bible_languages`(
		"created_at",
		"updated_at",
		"iso",
		"name",
		"name_local",
		"script",
		"script_code",
		"script_direction",
		"ldml",
		"rod",
		"numerals"
	)
SELECT "created_at",
	"updated_at",
	"iso",
	"name",
	"name_local",
	"script",
	"script_code",
	"script_direction",
	"ldml",
	"rod",
	"numerals"
FROM `bible_languages`;
--> statement-breakpoint
DROP TABLE `bible_languages`;
--> statement-breakpoint
ALTER TABLE `__new_bible_languages`
	RENAME TO `bible_languages`;
--> statement-breakpoint
CREATE INDEX `bible_languages_name_idx` ON `bible_languages` (`name`);
--> statement-breakpoint
CREATE INDEX `bible_languages_name_local_idx` ON `bible_languages` (`name_local`);
--> statement-breakpoint
CREATE INDEX `bible_languages_script_code_idx` ON `bible_languages` (`script_code`);
--> statement-breakpoint
CREATE INDEX `bible_languages_script_direction_idx` ON `bible_languages` (`script_direction`);
--> statement-breakpoint
CREATE TABLE `__new_bibles_to_rights_admins` (
	`bible_abbreviation` text NOT NULL,
	`rights_admin_uid` text NOT NULL,
	PRIMARY KEY(`bible_abbreviation`, `rights_admin_uid`),
	FOREIGN KEY (`bible_abbreviation`) REFERENCES `bibles`(`abbreviation`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`rights_admin_uid`) REFERENCES `bible_rights_admins`(`uid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_bibles_to_rights_admins`("bible_abbreviation", "rights_admin_uid")
SELECT "bibles"."abbreviation" AS `bible_abbreviation`,
	"bible_rights_admins"."uid" AS `rights_admin_uid`
FROM `bibles_to_rights_admins`
	JOIN `bible_rights_admins` ON `bible_rights_admins`.`id` = `bibles_to_rights_admins`.`rights_admin_id`
	JOIN `bibles` ON `bibles`.`id` = `bibles_to_rights_admins`.`bible_id`;
--> statement-breakpoint
DROP TABLE `bibles_to_rights_admins`;
--> statement-breakpoint
ALTER TABLE `__new_bibles_to_rights_admins`
	RENAME TO `bibles_to_rights_admins`;
--> statement-breakpoint
CREATE INDEX `bibles_to_rights_admins_bible_abbreviation_idx` ON `bibles_to_rights_admins` (`bible_abbreviation`);
--> statement-breakpoint
CREATE INDEX `bibles_to_rights_admins_rights_admin_uid_idx` ON `bibles_to_rights_admins` (`rights_admin_uid`);
--> statement-breakpoint
CREATE TABLE `__new_bible_rights_admins` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`uid` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text
);
--> statement-breakpoint
INSERT INTO `__new_bible_rights_admins`("created_at", "updated_at", "uid", "name", "url")
SELECT "created_at",
	"updated_at",
	"uid",
	"name",
	"url"
FROM `bible_rights_admins`;
--> statement-breakpoint
DROP TABLE `bible_rights_admins`;
--> statement-breakpoint
ALTER TABLE `__new_bible_rights_admins`
	RENAME TO `bible_rights_admins`;
--> statement-breakpoint
CREATE INDEX `bible_rights_admins_name_idx` ON `bible_rights_admins` (`name`);
--> statement-breakpoint
CREATE TABLE `__new_bibles_to_rights_holders` (
	`bible_abbreviation` text NOT NULL,
	`rights_holder_uid` text NOT NULL,
	PRIMARY KEY(`bible_abbreviation`, `rights_holder_uid`),
	FOREIGN KEY (`bible_abbreviation`) REFERENCES `bibles`(`abbreviation`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`rights_holder_uid`) REFERENCES `bible_rights_holders`(`uid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_bibles_to_rights_holders`("bible_abbreviation", "rights_holder_uid")
SELECT "bibles"."abbreviation" AS `bible_abbreviation`,
	"bible_rights_holders"."uid" AS `rights_holder_uid`
FROM `bibles_to_rights_holders`
	JOIN `bible_rights_holders` ON `bible_rights_holders`.`id` = `bibles_to_rights_holders`.`rights_holder_id`
	JOIN `bibles` ON `bibles`.`id` = `bibles_to_rights_holders`.`bible_id`;
--> statement-breakpoint
DROP TABLE `bibles_to_rights_holders`;
--> statement-breakpoint
ALTER TABLE `__new_bibles_to_rights_holders`
	RENAME TO `bibles_to_rights_holders`;
--> statement-breakpoint
CREATE INDEX `bibles_to_rights_holders_bible_abbreviation_idx` ON `bibles_to_rights_holders` (`bible_abbreviation`);
--> statement-breakpoint
CREATE INDEX `bibles_to_rights_holders_rights_holder_uid_idx` ON `bibles_to_rights_holders` (`rights_holder_uid`);
--> statement-breakpoint
CREATE TABLE `__new_bible_rights_holders` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`uid` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_local` text NOT NULL,
	`abbr` text NOT NULL,
	`url` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_bible_rights_holders`(
		"created_at",
		"updated_at",
		"uid",
		"name",
		"name_local",
		"abbr",
		"url"
	)
SELECT "created_at",
	"updated_at",
	"uid",
	"name",
	"name_local",
	"abbr",
	"url"
FROM `bible_rights_holders`;
--> statement-breakpoint
DROP TABLE `bible_rights_holders`;
--> statement-breakpoint
ALTER TABLE `__new_bible_rights_holders`
	RENAME TO `bible_rights_holders`;
--> statement-breakpoint
CREATE INDEX `bible_rights_holders_name_idx` ON `bible_rights_holders` (`name`);
--> statement-breakpoint
CREATE INDEX `bible_rights_holders_abbr_idx` ON `bible_rights_holders` (`abbr`);
--> statement-breakpoint
CREATE TABLE `__new_bibles` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`abbreviation` text PRIMARY KEY NOT NULL,
	`abbreviation_local` text NOT NULL,
	`name` text NOT NULL,
	`name_local` text NOT NULL,
	`description` text NOT NULL,
	`copyright_statement` text NOT NULL,
	`ready_for_publication` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_bibles`(
		"created_at",
		"updated_at",
		"abbreviation",
		"abbreviation_local",
		"name",
		"name_local",
		"description",
		"copyright_statement",
		"ready_for_publication"
	)
SELECT "created_at",
	"updated_at",
	"abbreviation",
	"abbreviation_local",
	"name",
	"name_local",
	"description",
	"copyright_statement",
	"ready_for_publication"
FROM `bibles`;
--> statement-breakpoint
DROP TABLE `bibles`;
--> statement-breakpoint
ALTER TABLE `__new_bibles`
	RENAME TO `bibles`;
--> statement-breakpoint
CREATE INDEX `bibles_abbreviation_local_idx` ON `bibles` (`abbreviation_local`);
--> statement-breakpoint
CREATE INDEX `bibles_name_idx` ON `bibles` (`name`);
--> statement-breakpoint
CREATE INDEX `bibles_name_local_idx` ON `bibles` (`name_local`);
--> statement-breakpoint
CREATE INDEX `bibles_ready_for_publication_idx` ON `bibles` (`ready_for_publication`);
--> statement-breakpoint
DROP INDEX `user_settings_preferred_bible_id_idx`;
--> statement-breakpoint
ALTER TABLE `user_settings`
ADD `preferred_bible_abbreviation` text REFERENCES bibles(abbreviation);
--> statement-breakpoint
UPDATE user_settings
SET preferred_bible_abbreviation = (
		SELECT abbreviation
		FROM bibles
		WHERE id = user_settings.preferred_bible_id
	)
WHERE preferred_bible_id IS NOT NULL;
--> statement-breakpoint
CREATE INDEX `user_settings_preferred_bible_abbreviation_idx` ON `user_settings` (`preferred_bible_abbreviation`);
--> statement-breakpoint
ALTER TABLE `user_settings` DROP COLUMN `preferred_bible_id`;
--> statement-breakpoint
PRAGMA foreign_keys = ON;