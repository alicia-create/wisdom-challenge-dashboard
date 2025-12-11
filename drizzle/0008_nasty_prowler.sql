CREATE TABLE `api_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platform` enum('meta','google') NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text,
	`expires_at` timestamp,
	`ad_account_id` varchar(255),
	`account_name` text,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_tokens_platform_unique` UNIQUE(`platform`)
);
