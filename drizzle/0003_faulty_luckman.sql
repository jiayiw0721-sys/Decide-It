CREATE TABLE `sharedDecisionMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sharedDecisionId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('creator','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sharedDecisionMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `sharedDecisionMembers_session_user_unique` UNIQUE(`sharedDecisionId`,`userId`)
);
--> statement-breakpoint
CREATE INDEX `sharedDecisionMembers_session_idx` ON `sharedDecisionMembers` (`sharedDecisionId`);