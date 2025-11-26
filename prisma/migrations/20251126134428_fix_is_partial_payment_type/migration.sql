/*
  Warnings:

  - The `isPartialPayment` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "isPartialPayment",
ADD COLUMN     "isPartialPayment" BOOLEAN NOT NULL DEFAULT false;
