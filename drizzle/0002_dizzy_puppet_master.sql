CREATE TABLE `decisionVotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sharedDecisionId` int NOT NULL,
	`userId` int NOT NULL,
	`optionId` varchar(80) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `decisionVotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `decisionVotes_session_user_unique` UNIQUE(`sharedDecisionId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `sharedDecisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shareCode` varchar(16) NOT NULL,
	`creatorId` int NOT NULL,
	`question` varchar(240) NOT NULL,
	`options` json NOT NULL,
	`status` enum('open','resolved') NOT NULL DEFAULT 'open',
	`finalOptionId` varchar(80),
	`finalReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `sharedDecisions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sharedDecisions_shareCode_unique` UNIQUE(`shareCode`)
);
--> statement-breakpoint
CREATE INDEX `decisionVotes_session_option_idx` ON `decisionVotes` (`sharedDecisionId`,`optionId`);--> statement-breakpoint
CREATE INDEX `sharedDecisions_creator_created_idx` ON `sharedDecisions` (`creatorId`,`createdAt`);