DROP INDEX IF EXISTS `passwords_user_id_idx`;--> statement-breakpoint
ALTER TABLE `passwords` ADD `active` integer DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX `passwords_user_id_idx` ON `passwords` (`userId`);--> statement-breakpoint
ALTER TABLE `passwords` DROP COLUMN `salt`;