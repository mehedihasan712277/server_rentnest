-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'PAST_DUE';

-- CreateIndex
CREATE INDEX "payments_rentalId_idx" ON "payments"("rentalId");
