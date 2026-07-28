-- CreateEnum
CREATE TYPE "OverrideType" AS ENUM ('MOVED', 'EXTRA');

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "clerkOrganizationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleOverride" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "type" "OverrideType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "newDate" TIMESTAMP(3),
    "startMinutes" INTEGER,
    "endMinutes" INTEGER,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchNote" (
    "id" TEXT NOT NULL,
    "clerkOrganizationId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileKey" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedByClerkUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BatchNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Holiday_clerkOrganizationId_date_idx" ON "Holiday"("clerkOrganizationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_clerkOrganizationId_date_key" ON "Holiday"("clerkOrganizationId", "date");

-- CreateIndex
CREATE INDEX "ScheduleOverride_batchId_date_idx" ON "ScheduleOverride"("batchId", "date");

-- CreateIndex
CREATE INDEX "ScheduleOverride_batchId_newDate_idx" ON "ScheduleOverride"("batchId", "newDate");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleOverride_batchId_date_type_key" ON "ScheduleOverride"("batchId", "date", "type");

-- CreateIndex
CREATE UNIQUE INDEX "BatchNote_fileKey_key" ON "BatchNote"("fileKey");

-- CreateIndex
CREATE INDEX "BatchNote_batchId_createdAt_idx" ON "BatchNote"("batchId", "createdAt");

-- CreateIndex
CREATE INDEX "BatchNote_clerkOrganizationId_idx" ON "BatchNote"("clerkOrganizationId");

-- AddForeignKey
ALTER TABLE "ScheduleOverride" ADD CONSTRAINT "ScheduleOverride_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchNote" ADD CONSTRAINT "BatchNote_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
