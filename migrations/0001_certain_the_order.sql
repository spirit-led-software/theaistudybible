CREATE TABLE `bible_languages_new` (
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
INSERT INTO "bible_languages_new" SELECT * FROM "bible_languages";--> statement-breakpoint
DROP TABLE "bible_languages";--> statement-breakpoint
ALTER TABLE "bible_languages_new" RENAME TO "bible_languages";--> statement-breakpoint
CREATE UNIQUE INDEX `bible_languages_iso_unique` ON `bible_languages` (`iso`);