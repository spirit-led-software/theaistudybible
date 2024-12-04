DROP TABLE `security_key_credential`;--> statement-breakpoint
DROP INDEX IF EXISTS `forgotten_password_codes_user_id_idx`;--> statement-breakpoint
CREATE INDEX `forgotten_password_codes_code_idx` ON `forgotten_password_codes` (`code`);--> statement-breakpoint
CREATE INDEX `forgotten_password_codes_user_id_idx` ON `forgotten_password_codes` (`userId`);