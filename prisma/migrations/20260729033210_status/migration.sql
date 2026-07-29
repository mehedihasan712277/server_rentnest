/*
  Warnings:

  - Made the column `comment` on table `reviews` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "ReviewStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "reviews" ALTER COLUMN "comment" SET NOT NULL;
