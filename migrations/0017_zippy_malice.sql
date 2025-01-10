ALTER TABLE `users` ADD `google_id` text;--> statement-breakpoint
CREATE INDEX `users_google_id_idx` ON `users` (`google_id`);