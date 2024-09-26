CREATE TABLE `bible_contributors_new` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`uid` text NOT NULL,
	`name` text NOT NULL,
	`content` integer DEFAULT 0 NOT NULL,
	`publication` integer DEFAULT 0 NOT NULL,
	`management` integer DEFAULT 0 NOT NULL,
	`finance` integer DEFAULT 0 NOT NULL,
	`qa` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
INSERT INTO "bible_contributors_new" SELECT * FROM "bible_contributors";--> statement-breakpoint
DROP TABLE "bible_contributors";--> statement-breakpoint
ALTER TABLE "bible_contributors_new" RENAME TO "bible_contributors";--> statement-breakpoint
CREATE UNIQUE INDEX `bible_contributors_uid_unique` ON `bible_contributors` (`uid`);