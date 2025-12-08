CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alert_type` enum('high_cpp','low_click_to_purchase','high_frequency') NOT NULL,
	`metric_value` decimal(10,2) NOT NULL,
	`threshold` decimal(10,2) NOT NULL,
	`message` text NOT NULL,
	`notification_sent` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`resolved_at` timestamp,
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
