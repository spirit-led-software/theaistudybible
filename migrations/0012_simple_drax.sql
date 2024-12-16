DROP INDEX `users_preferred_bible_id_idx`;--> statement-breakpoint
CREATE TABLE `users_new` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`email` text NOT NULL,
	`first_name` text,
	`last_name` text,
	`image` text,
	`stripe_customer_id` text
);
--> statement-breakpoint
INSERT INTO `users_new` (
    `id`,
    `created_at`,
    `updated_at`,
    `email`,
    `first_name`,
    `last_name`,
    `image`,
    `stripe_customer_id`
) SELECT `id`, `created_at`, `updated_at`, `email`, `first_name`, `last_name`, `image`, `stripe_customer_id` FROM `users`;
--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `users_new` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_stripe_customer_id_idx` ON `users` (`stripe_customer_id`);--> statement-breakpoint
ALTER TABLE `user_settings` ADD `preferred_bible_id` text REFERENCES bibles(id);--> statement-breakpoint
CREATE INDEX `user_settings_preferred_bible_id_idx` ON `user_settings` (`preferred_bible_id`);