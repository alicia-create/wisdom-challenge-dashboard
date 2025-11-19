CREATE TABLE `ad_performance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` datetime NOT NULL,
	`platform` varchar(50) NOT NULL,
	`spend` decimal(10,2) NOT NULL,
	`clicks` int DEFAULT 0,
	`impressions` int DEFAULT 0,
	`link_clicks` int DEFAULT 0,
	`reported_leads` int DEFAULT 0,
	`reported_purchases` int DEFAULT 0,
	`utm_campaign` varchar(255),
	`utm_source` varchar(255),
	`utm_medium` varchar(255),
	CONSTRAINT `ad_performance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` datetime NOT NULL,
	`attendance_type` varchar(100) NOT NULL,
	`count` int DEFAULT 0,
	CONSTRAINT `daily_attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_kpis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` datetime NOT NULL,
	`total_leads` int DEFAULT 0,
	`total_spend` decimal(10,2) DEFAULT '0',
	`cpl` decimal(10,2),
	`vip_sales` int DEFAULT 0,
	`vip_revenue` decimal(10,2) DEFAULT '0',
	`cpp` decimal(10,2),
	`roas` decimal(10,4),
	`vip_take_rate` decimal(5,2),
	`welcome_email_clicks` int DEFAULT 0,
	CONSTRAINT `daily_kpis_id` PRIMARY KEY(`id`),
	CONSTRAINT `daily_kpis_date_unique` UNIQUE(`date`)
);
--> statement-breakpoint
CREATE TABLE `Lead` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contact_id` varchar(255),
	`email` varchar(320),
	`name` text,
	`phone` varchar(50),
	`created_at` datetime NOT NULL,
	`welcome_email_clicked` boolean DEFAULT false,
	`utm_source` varchar(255),
	`utm_medium` varchar(255),
	`utm_campaign` varchar(255),
	`utm_content` varchar(255),
	`utm_term` varchar(255),
	CONSTRAINT `Lead_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Order` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contact_id` varchar(255),
	`email` varchar(320),
	`order_total` decimal(10,2) NOT NULL,
	`product_name` text,
	`created_at` datetime NOT NULL,
	`utm_source` varchar(255),
	`utm_medium` varchar(255),
	`utm_campaign` varchar(255),
	`utm_content` varchar(255),
	`utm_term` varchar(255),
	CONSTRAINT `Order_id` PRIMARY KEY(`id`)
);
