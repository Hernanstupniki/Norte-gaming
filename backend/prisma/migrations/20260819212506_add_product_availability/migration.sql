-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "currentPrice" DROP NOT NULL;

-- CreateEnum
CREATE TYPE "ProductAvailability" AS ENUM ('IN_STOCK', 'OUT_OF_STOCK', 'ORDER_ONLY');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "availability" "ProductAvailability" NOT NULL DEFAULT 'IN_STOCK';
