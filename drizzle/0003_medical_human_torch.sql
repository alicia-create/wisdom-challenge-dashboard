CREATE TABLE `facebook_audiences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`audience_id` varchar(255) NOT NULL,
	`name` text NOT NULL,
	`ad_account_id` varchar(255) NOT NULL,
	`size_lower_bound` int,
	`size_upper_bound` int,
	`subtype` varchar(50),
	`time_created` datetime,
	`time_updated` datetime,
	`synced_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `facebook_audiences_id` PRIMARY KEY(`id`),
	CONSTRAINT `facebook_audiences_audience_id_unique` UNIQUE(`audience_id`)
);
