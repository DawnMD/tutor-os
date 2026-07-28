-- CreateEnum
CREATE TYPE "FeePaymentStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "FeePaymentMethod" AS ENUM ('ONLINE', 'CASH', 'OFFLINE_UPI');

-- AlterTable
ALTER TABLE "Batch" ADD COLUMN     "monthlyFeePaise" INTEGER;

-- CreateTable
CREATE TABLE "FeePayment" (
    "id" TEXT NOT NULL,
    "clerkOrganizationId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "status" "FeePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "FeePaymentMethod" NOT NULL,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "note" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeePayment_razorpayOrderId_key" ON "FeePayment"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "FeePayment_razorpayPaymentId_key" ON "FeePayment"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "FeePayment_clerkOrganizationId_idx" ON "FeePayment"("clerkOrganizationId");

-- CreateIndex
CREATE INDEX "FeePayment_studentId_status_idx" ON "FeePayment"("studentId", "status");

-- CreateIndex
CREATE INDEX "FeePayment_batchId_periodYear_periodMonth_idx" ON "FeePayment"("batchId", "periodYear", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "FeePayment_batchId_studentId_periodYear_periodMonth_key" ON "FeePayment"("batchId", "studentId", "periodYear", "periodMonth");

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
