PRAGMA foreign_keys = OFF;
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
	FOREIGN KEY (`bible_abbreviation`, `book_code`) REFERENCES `books`(`bible_abbreviation`, `code`) ON UPDATE no action ON DELETE cascade
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
SELECT "created_at",
	"updated_at",
	"bible_abbreviation",
	"book_code",
	"previous_code",
	"next_code",
	"code",
	"name",
	"number",
	"content"
FROM `chapters`;
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
	FOREIGN KEY (`bible_abbreviation`, `book_code`, `chapter_code`) REFERENCES `books`(`bible_abbreviation`, `code`, `code`) ON UPDATE no action ON DELETE cascade
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
SELECT "created_at",
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
FROM `verses`;
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
CREATE INDEX `verses_next_code_idx` ON `verses` (`next_code`);
--> statement-breakpoint
CREATE INDEX `verses_code_idx` ON `verses` (`code`);
--> statement-breakpoint
CREATE INDEX `verses_name_idx` ON `verses` (`name`);
--> statement-breakpoint
CREATE INDEX `verses_number_idx` ON `verses` (`number`);
PRAGMA foreign_keys = ON;
--> statement-breakpoint