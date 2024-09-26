ALTER TABLE `chapters` RENAME COLUMN `abbreviation` TO `code`;--> statement-breakpoint
ALTER TABLE `verses` RENAME COLUMN `abbreviation` TO `code`;--> statement-breakpoint
ALTER TABLE `books` RENAME COLUMN `abbreviation` TO `code`;--> statement-breakpoint
ALTER TABLE `books` ADD `abbreviation` text;
