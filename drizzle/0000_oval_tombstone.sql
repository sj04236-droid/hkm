CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`picture` text,
	`customer_key` text NOT NULL,
	`trial_used` integer DEFAULT 0 NOT NULL,
	`subscription_status` text DEFAULT 'trial' NOT NULL,
	`billing_key_cipher` text,
	`next_billing_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_customer_key_unique` ON `accounts` (`customer_key`);--> statement-breakpoint
CREATE TABLE `payments` (
	`order_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`payment_key` text,
	`amount` integer NOT NULL,
	`status` text NOT NULL,
	`approved_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `usage_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`feature` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
