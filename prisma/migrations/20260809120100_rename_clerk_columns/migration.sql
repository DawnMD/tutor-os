-- Identity moved from Clerk into this database (see the `user`/`organization`/
-- `member` tables added in the previous migration), so the `clerk`-prefixed
-- scoping columns are renamed to plain ones.
--
-- Written by hand as RENAME rather than accepting Prisma's generated
-- DROP COLUMN + ADD COLUMN, which would silently discard every organization and
-- user id on six tables. The index renames matter too: skipping them leaves the
-- constraint names drifted from what Prisma expects and the next `migrate dev`
-- emits a spurious drift migration.

-- AlterTable
ALTER TABLE "Class" RENAME COLUMN "clerkOrganizationId" TO "organizationId";

-- AlterTable
ALTER TABLE "Student" RENAME COLUMN "clerkOrganizationId" TO "organizationId";
ALTER TABLE "Student" RENAME COLUMN "clerkUserId" TO "userId";

-- AlterTable
ALTER TABLE "Batch" RENAME COLUMN "clerkOrganizationId" TO "organizationId";

-- AlterTable
ALTER TABLE "Holiday" RENAME COLUMN "clerkOrganizationId" TO "organizationId";

-- AlterTable
ALTER TABLE "BatchNote" RENAME COLUMN "clerkOrganizationId" TO "organizationId";
ALTER TABLE "BatchNote" RENAME COLUMN "uploadedByClerkUserId" TO "uploadedByUserId";

-- AlterTable
ALTER TABLE "FeePayment" RENAME COLUMN "clerkOrganizationId" TO "organizationId";

-- RenameIndex
ALTER INDEX "Class_clerkOrganizationId_name_key" RENAME TO "Class_organizationId_name_key";
ALTER INDEX "Class_clerkOrganizationId_idx" RENAME TO "Class_organizationId_idx";
ALTER INDEX "Class_clerkOrganizationId_archivedAt_idx" RENAME TO "Class_organizationId_archivedAt_idx";

-- RenameIndex
ALTER INDEX "Student_clerkOrganizationId_clerkUserId_key" RENAME TO "Student_organizationId_userId_key";
ALTER INDEX "Student_clerkOrganizationId_email_idx" RENAME TO "Student_organizationId_email_idx";
ALTER INDEX "Student_clerkOrganizationId_idx" RENAME TO "Student_organizationId_idx";
ALTER INDEX "Student_clerkOrganizationId_archivedAt_idx" RENAME TO "Student_organizationId_archivedAt_idx";
ALTER INDEX "Student_clerkOrganizationId_fullName_idx" RENAME TO "Student_organizationId_fullName_idx";

-- RenameIndex
ALTER INDEX "Batch_clerkOrganizationId_idx" RENAME TO "Batch_organizationId_idx";

-- RenameIndex
ALTER INDEX "Holiday_clerkOrganizationId_date_key" RENAME TO "Holiday_organizationId_date_key";
ALTER INDEX "Holiday_clerkOrganizationId_date_idx" RENAME TO "Holiday_organizationId_date_idx";

-- RenameIndex
ALTER INDEX "BatchNote_clerkOrganizationId_idx" RENAME TO "BatchNote_organizationId_idx";

-- RenameIndex
ALTER INDEX "FeePayment_clerkOrganizationId_idx" RENAME TO "FeePayment_organizationId_idx";
