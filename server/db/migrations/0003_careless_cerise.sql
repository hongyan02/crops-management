CREATE TABLE `supplier_product_prices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`supplier_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`price` real NOT NULL,
	`quoted_at` integer DEFAULT (unixepoch()) NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_spp_supplier_product` ON `supplier_product_prices` (`supplier_id`,`product_id`);--> statement-breakpoint
CREATE INDEX `idx_spp_product` ON `supplier_product_prices` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_spp_quoted_at` ON `supplier_product_prices` (`quoted_at`);