/*
  Warnings:

  - The values [PENDING] on the enum `ReviewStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReviewStatus_new" AS ENUM ('APPROVED', 'CANCELED');
ALTER TABLE "public"."reviews" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "reviews" ALTER COLUMN "status" TYPE "ReviewStatus_new" USING ("status"::text::"ReviewStatus_new");
ALTER TYPE "ReviewStatus" RENAME TO "ReviewStatus_old";
ALTER TYPE "ReviewStatus_new" RENAME TO "ReviewStatus";
DROP TYPE "public"."ReviewStatus_old";
ALTER TABLE "reviews" ALTER COLUMN "status" SET DEFAULT 'APPROVED';
COMMIT;

-- AlterTable
ALTER TABLE "reviews" ALTER COLUMN "status" SET DEFAULT 'APPROVED';
