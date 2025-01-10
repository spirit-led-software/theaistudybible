ALTER TABLE `users` ADD `apple_id` text;--> statement-breakpoint
CREATE INDEX `users_apple_id_idx` ON `users` (`apple_id`);