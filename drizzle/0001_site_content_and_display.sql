CREATE TABLE `content_overrides` (
	`locale` text NOT NULL,
	`path` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	PRIMARY KEY(`locale`, `path`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `listings` ADD `display` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `lat` real;--> statement-breakpoint
ALTER TABLE `listings` ADD `lng` real;--> statement-breakpoint
ALTER TABLE `listings` ADD `map_mode` text DEFAULT 'off' NOT NULL;