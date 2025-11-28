/*
  Warnings:

  - You are about to drop the column `paymentFile` on the `Invoice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "paymentFile",
ADD COLUMN     "paymentFileUrl" TEXT;
