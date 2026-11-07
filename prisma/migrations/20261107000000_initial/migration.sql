-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'WORKER', 'FARMER', 'EXPERT', 'ADMIN') NOT NULL DEFAULT 'FARMER',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `isDemo` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Disease` (
    `id` VARCHAR(191) NOT NULL,
    `cropType` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `symptoms` TEXT NOT NULL,
    `management` TEXT NOT NULL,
    `prevention` TEXT NOT NULL,
    `damage` TEXT NULL,
    `imageSuitability` ENUM('SCREENABLE', 'SUGGESTIVE_ONLY', 'FIELD_OR_LAB_ONLY') NULL,
    `sourceTitle` VARCHAR(191) NULL,
    `sourceOrg` VARCHAR(191) NULL,
    `sourceUrl` VARCHAR(191) NULL,
    `sourceReviewedAt` DATETIME(3) NULL,
    `needsExpertReview` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Disease_cropType_name_key`(`cropType`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DiseaseReview` (
    `id` VARCHAR(191) NOT NULL,
    `diseaseId` VARCHAR(191) NOT NULL,
    `reviewerId` VARCHAR(191) NOT NULL,
    `decision` ENUM('REVIEWED', 'NEEDS_REVISION') NOT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DiseaseReview_diseaseId_createdAt_idx`(`diseaseId`, `createdAt`),
    INDEX `DiseaseReview_reviewerId_createdAt_idx`(`reviewerId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Case` (
    `id` VARCHAR(191) NOT NULL,
    `farmerId` VARCHAR(191) NOT NULL,
    `cropType` VARCHAR(191) NOT NULL,
    `imagePath` VARCHAR(191) NOT NULL,
    `aiResult` JSON NOT NULL,
    `confidence` DOUBLE NOT NULL,
    `status` ENUM('PENDING', 'VERIFIED', 'CORRECTED') NOT NULL DEFAULT 'PENDING',
    `expertNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Case_farmerId_idx`(`farmerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CaseReview` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `reviewerId` VARCHAR(191) NOT NULL,
    `action` ENUM('VERIFIED', 'CORRECTED') NOT NULL,
    `previousStatus` ENUM('PENDING', 'VERIFIED', 'CORRECTED') NOT NULL,
    `correctedCondition` VARCHAR(191) NULL,
    `farmerVisibleNote` TEXT NULL,
    `internalNote` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CaseReview_caseId_createdAt_idx`(`caseId`, `createdAt`),
    INDEX `CaseReview_reviewerId_createdAt_idx`(`reviewerId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CropCondition` (
    `id` VARCHAR(191) NOT NULL,
    `crop` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(191) NOT NULL DEFAULT 'Disease',
    `name` VARCHAR(191) NOT NULL,
    `cues` TEXT NOT NULL,
    `care` TEXT NOT NULL,
    `prevention` TEXT NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `sourceUrl` TEXT NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `reviewStatus` VARCHAR(191) NOT NULL,
    `reviewedAt` DATE NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `limitations` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CropCondition_crop_enabled_idx`(`crop`, `enabled`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FarmCase` (
    `id` VARCHAR(191) NOT NULL,
    `crop` VARCHAR(191) NOT NULL,
    `area` VARCHAR(191) NOT NULL,
    `sampleLabel` VARCHAR(191) NOT NULL,
    `plantAge` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `status` ENUM('OPEN', 'MONITORING', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `nextFollowUp` DATE NULL,
    `screening` JSON NOT NULL,
    `sample` BOOLEAN NOT NULL DEFAULT false,
    `walkthrough` BOOLEAN NOT NULL DEFAULT false,
    `submissionHash` VARCHAR(191) NULL,
    `revision` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FarmCase_createdById_status_idx`(`createdById`, `status`),
    INDEX `FarmCase_crop_status_idx`(`crop`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FarmObservation` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `symptoms` TEXT NOT NULL,
    `actions` TEXT NOT NULL,
    `change` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `photoId` VARCHAR(191) NULL,
    `samplePath` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FarmObservation_caseId_date_idx`(`caseId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FarmImage` (
    `id` VARCHAR(191) NOT NULL,
    `uploaderId` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `bytes` MEDIUMBLOB NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FarmImage_uploaderId_idx`(`uploaderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FarmAssignment` (
    `caseId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`caseId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FarmStatusEvent` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `reason` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FarmStatusEvent_caseId_createdAt_idx`(`caseId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FarmDraft` (
    `userId` VARCHAR(191) NOT NULL,
    `data` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FarmScreening` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `fingerprint` VARCHAR(191) NOT NULL,
    `mode` VARCHAR(191) NOT NULL DEFAULT 'live',
    `scenario` VARCHAR(191) NULL,
    `claimToken` VARCHAR(191) NULL,
    `state` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `result` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FarmScreening_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DiseaseReview` ADD CONSTRAINT `DiseaseReview_diseaseId_fkey` FOREIGN KEY (`diseaseId`) REFERENCES `Disease`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiseaseReview` ADD CONSTRAINT `DiseaseReview_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Case` ADD CONSTRAINT `Case_farmerId_fkey` FOREIGN KEY (`farmerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CaseReview` ADD CONSTRAINT `CaseReview_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CaseReview` ADD CONSTRAINT `CaseReview_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FarmCase` ADD CONSTRAINT `FarmCase_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FarmObservation` ADD CONSTRAINT `FarmObservation_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `FarmCase`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FarmObservation` ADD CONSTRAINT `FarmObservation_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FarmObservation` ADD CONSTRAINT `FarmObservation_photoId_fkey` FOREIGN KEY (`photoId`) REFERENCES `FarmImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FarmImage` ADD CONSTRAINT `FarmImage_uploaderId_fkey` FOREIGN KEY (`uploaderId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FarmAssignment` ADD CONSTRAINT `FarmAssignment_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `FarmCase`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FarmAssignment` ADD CONSTRAINT `FarmAssignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FarmStatusEvent` ADD CONSTRAINT `FarmStatusEvent_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `FarmCase`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FarmDraft` ADD CONSTRAINT `FarmDraft_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FarmScreening` ADD CONSTRAINT `FarmScreening_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

