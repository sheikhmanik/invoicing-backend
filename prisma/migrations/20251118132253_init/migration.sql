/*
  Warnings:

  - A unique constraint covering the columns `[planName]` on the table `PricingPlan` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PricingPlan" ADD COLUMN     "fixedPrice" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "PricingPlan_planName_key" ON "PricingPlan"("planName");
