/*
  Warnings:

  - You are about to drop the column `subject` on the `Batch` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[classId,name]` on the table `Batch` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `classId` to the `Batch` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Batch_clerkOrganizationId_archivedAt_idx";

-- DropIndex
DROP INDEX "Batch_clerkOrganizationId_name_idx";

-- AlterTable
ALTER TABLE "Batch" DROP COLUMN "subject",
ADD COLUMN     "classId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "clerkOrganizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Class_clerkOrganizationId_idx" ON "Class"("clerkOrganizationId");

-- CreateIndex
CREATE INDEX "Class_clerkOrganizationId_archivedAt_idx" ON "Class"("clerkOrganizationId", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Class_clerkOrganizationId_name_key" ON "Class"("clerkOrganizationId", "name");

-- CreateIndex
CREATE INDEX "Batch_classId_idx" ON "Batch"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_classId_name_key" ON "Batch"("classId", "name");

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
