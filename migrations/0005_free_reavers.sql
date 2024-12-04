CREATE TABLE `passkey_credential` (
	`id` blob PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`algorithm_id` integer NOT NULL,
	`public_key` blob NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `passkey_credential_user_id_idx` ON `passkey_credential` (`user_id`);--> statement-breakpoint
CREATE INDEX `passkey_credential_algorithm_id_idx` ON `passkey_credential` (`algorithm_id`);--> statement-breakpoint
CREATE TABLE `security_key_credential` (
	`id` blob PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`algorithm_id` integer NOT NULL,
	`public_key` blob NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `security_key_credential_user_id_idx` ON `security_key_credential` (`user_id`);--> statement-breakpoint
CREATE INDEX `security_key_credential_algorithm_id_idx` ON `security_key_credential` (`algorithm_id`);