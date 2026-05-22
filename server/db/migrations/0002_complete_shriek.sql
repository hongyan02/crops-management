CREATE TABLE `buyer_products` (
	`buyer_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pk_buyer_products` ON `buyer_products` (`buyer_id`,`product_id`);--> statement-breakpoint
CREATE INDEX `idx_bp_product` ON `buyer_products` (`product_id`);--> statement-breakpoint
ALTER TABLE `buyer_requirements` ADD `quality_level` text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE `buyer_requirements` ADD `notes` text;--> statement-breakpoint
CREATE INDEX `idx_br_metric_level` ON `buyer_requirements` (`metric_id`,`quality_level`);