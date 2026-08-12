CREATE TABLE `decisionRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`question` varchar(240) NOT NULL,
	`options` json NOT NULL,
	`mode` enum('fair','weighted') NOT NULL,
	`chosenOption` varchar(160) NOT NULL,
	`reason` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `decisionRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `decisionRecords_user_created_idx` ON `decisionRecords` (`userId`,`createdAt`);