CREATE TABLE `diary_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entry_id` int,
	`action_type` enum('manual','llm_suggestion','meta_api_sync','scheduled') NOT NULL,
	`category` varchar(100),
	`description` text NOT NULL,
	`status` enum('pending','in_progress','completed','verified','cancelled') NOT NULL DEFAULT 'pending',
	`source` varchar(255),
	`ad_id` varchar(255),
	`campaign_id` varchar(255),
	`scheduled_for` datetime,
	`created_by` varchar(320),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`verified_at` timestamp,
	CONSTRAINT `diary_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diary_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` datetime NOT NULL,
	`summary_type` varchar(50) NOT NULL DEFAULT 'daily',
	`metrics_json` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `diary_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `diary_entries_date_unique` UNIQUE(`date`)
);
