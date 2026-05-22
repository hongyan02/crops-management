CREATE TABLE `product_metrics` (
	`product_id` integer NOT NULL,
	`metric_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pk_product_metrics` ON `product_metrics` (`product_id`,`metric_id`);--> statement-breakpoint
CREATE INDEX `idx_pm_metric` ON `product_metrics` (`metric_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`unit` text DEFAULT '吨' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_products_category` ON `products` (`category`);--> statement-breakpoint
CREATE TABLE `quality_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`unit` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quality_metrics_name_unique` ON `quality_metrics` (`name`);--> statement-breakpoint
CREATE TABLE `supplier_products` (
	`supplier_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pk_supplier_products` ON `supplier_products` (`supplier_id`,`product_id`);--> statement-breakpoint
CREATE INDEX `idx_sp_product` ON `supplier_products` (`product_id`);--> statement-breakpoint
CREATE TABLE `supplier_quality` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`supplier_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`metric_id` integer NOT NULL,
	`value` text NOT NULL,
	`batch_no` text,
	`recorded_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_sq_supplier` ON `supplier_quality` (`supplier_id`);--> statement-breakpoint
CREATE INDEX `idx_sq_product` ON `supplier_quality` (`product_id`);--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`contact` text,
	`phone` text,
	`address` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `buyer_requirements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`buyer_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`metric_id` integer NOT NULL,
	`min_value` text,
	`max_value` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_br_buyer` ON `buyer_requirements` (`buyer_id`);--> statement-breakpoint
CREATE INDEX `idx_br_product` ON `buyer_requirements` (`product_id`);--> statement-breakpoint
CREATE TABLE `buyers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`contact` text,
	`phone` text,
	`address` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
