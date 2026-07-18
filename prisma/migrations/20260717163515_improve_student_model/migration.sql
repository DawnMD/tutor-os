/*
  Warnings:

  - A unique constraint covering the columns `[clerkOrganizationId,clerkUserId]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Student_clerkOrganizationId_email_key";

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "fullName" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Student_clerkOrganizationId_email_idx" ON "Student"("clerkOrganizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_clerkOrganizationId_clerkUserId_key" ON "Student"("clerkOrganizationId", "clerkUserId");
