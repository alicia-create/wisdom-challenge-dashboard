CREATE TABLE `keap_tokens` (
	`id` int NOT NULL DEFAULT 1,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`expires_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `keap_tokens_id` PRIMARY KEY(`id`)
);
