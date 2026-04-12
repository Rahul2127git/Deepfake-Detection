CREATE TABLE `scans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`result` enum('Real','Deepfake') NOT NULL,
	`confidence` int NOT NULL,
	`modelVersion` varchar(64) NOT NULL DEFAULT 'v1.0',
	`frameAnalysis` text,
	`processingTime` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scans_id` PRIMARY KEY(`id`)
);
