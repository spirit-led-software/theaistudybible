CREATE TABLE `reading_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`user_id` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text
);
--> statement-breakpoint
CREATE TABLE `user_credits` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`user_id` text NOT NULL,
	`balance` integer DEFAULT 10 NOT NULL,
	`last_reading_credit_at` text
);
--> statement-breakpoint
ALTER TABLE `roles` DROP COLUMN `permissions`;