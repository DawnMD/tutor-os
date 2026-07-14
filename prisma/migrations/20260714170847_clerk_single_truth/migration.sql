/*
  Warnings:

  - You are about to drop the column `endTime` on the `Batch` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `Batch` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Batch` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `BatchSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `BatchSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the `Organization` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[batchId,classDate]` on the table `BatchSession` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[batchId,title]` on the table `Exam` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[clerkOrganizationId,email]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clerkOrganizationId` to the `Batch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endMinutes` to the `BatchSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startMinutes` to the `BatchSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clerkOrganizationId` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Batch" DROP CONSTRAINT "Batch_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_organizationId_fkey";

-- DropIndex
DROP INDEX "Batch_organizationId_archivedAt_idx";

-- DropIndex
DROP INDEX "Batch_organizationId_idx";

-- DropIndex
DROP INDEX "Student_organizationId_archivedAt_idx";

-- DropIndex
DROP INDEX "Student_organizationId_email_key";

-- DropIndex
DROP INDEX "Student_organizationId_idx";

-- AlterTable
ALTER TABLE "Batch" DROP COLUMN "endTime",
DROP COLUMN "organizationId",
DROP COLUMN "startTime",
ADD COLUMN     "clerkOrganizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "BatchSchedule" DROP COLUMN "endTime",
DROP COLUMN "startTime",
ADD COLUMN     "endMinutes" INTEGER NOT NULL,
ADD COLUMN     "startMinutes" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "organizationId",
ADD COLUMN     "clerkOrganizationId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Organization";

-- DropEnum
DROP TYPE "AnnouncementAudience";

-- DropEnum
DROP TYPE "InvitationStatus";

-- CreateIndex
CREATE INDEX "Batch_clerkOrganizationId_idx" ON "Batch"("clerkOrganizationId");

-- CreateIndex
CREATE INDEX "Batch_clerkOrganizationId_archivedAt_idx" ON "Batch"("clerkOrganizationId", "archivedAt");

-- CreateIndex
CREATE INDEX "Batch_clerkOrganizationId_name_idx" ON "Batch"("clerkOrganizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "BatchSession_batchId_classDate_key" ON "BatchSession"("batchId", "classDate");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_batchId_title_key" ON "Exam"("batchId", "title");

-- CreateIndex
CREATE INDEX "Student_clerkOrganizationId_idx" ON "Student"("clerkOrganizationId");

-- CreateIndex
CREATE INDEX "Student_clerkOrganizationId_archivedAt_idx" ON "Student"("clerkOrganizationId", "archivedAt");

-- CreateIndex
CREATE INDEX "Student_clerkOrganizationId_fullName_idx" ON "Student"("clerkOrganizationId", "fullName");

-- CreateIndex
CREATE UNIQUE INDEX "Student_clerkOrganizationId_email_key" ON "Student"("clerkOrganizationId", "email");
