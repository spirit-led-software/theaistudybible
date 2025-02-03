CREATE UNIQUE INDEX `books_unique_bible_code_idx` ON `books` (`bible_id`,`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `chapters_unique_bible_code_idx` ON `chapters` (`bible_id`,`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `verses_unique_bible_code_idx` ON `verses` (`bible_id`,`code`);