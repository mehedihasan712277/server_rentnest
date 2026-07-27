/*
  Warnings:

  - Added the required column `landlordId` to the `rentalrequests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "rentalrequests" ADD COLUMN     "landlordId" TEXT NOT NULL;
