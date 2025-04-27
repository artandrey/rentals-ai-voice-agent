CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`preferred_language` text NOT NULL,
	`preferred_currency` text NOT NULL,
	`telegram_user_id` integer
);
