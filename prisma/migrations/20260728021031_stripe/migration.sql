/*
  Warnings:

  - A unique constraint covering the columns `[stripeSessionId]` on the table `rentalrequests` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `rentalrequests` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "rentalrequests" ADD COLUMN     "stripeSessionId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "rentalrequests_stripeSessionId_key" ON "rentalrequests"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "rentalrequests_stripeSubscriptionId_key" ON "rentalrequests"("stripeSubscriptionId");
