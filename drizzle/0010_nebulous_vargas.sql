CREATE TABLE `ad_flag_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ad_id` varchar(255) NOT NULL,
	`ad_name` varchar(500) NOT NULL,
	`campaign_id` varchar(255),
	`campaign_name` varchar(500),
	`adset_id` varchar(255),
	`adset_name` varchar(500),
	`date` datetime NOT NULL,
	`strike_count` int NOT NULL,
	`flag_type` varchar(100) NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL,
	`status` enum('flagged','recovered','disabled') NOT NULL DEFAULT 'flagged',
	`metric_value` decimal(10,2),
	`threshold` decimal(10,2),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`resolved_at` timestamp,
	CONSTRAINT `ad_flag_history_id` PRIMARY KEY(`id`)
);
