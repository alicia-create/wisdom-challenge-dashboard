CREATE TABLE `social_media_followers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` date NOT NULL,
	`facebook_followers` int NOT NULL DEFAULT 0,
	`instagram_followers` int NOT NULL DEFAULT 0,
	`youtube_followers` int NOT NULL DEFAULT 0,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_media_followers_id` PRIMARY KEY(`id`),
	CONSTRAINT `social_media_followers_date_unique` UNIQUE(`date`)
);
