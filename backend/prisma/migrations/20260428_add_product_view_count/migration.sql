-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

-- Optional index for sorting/ranking by views in admin reports
CREATE INDEX "Product_viewCount_idx" ON "Product"("viewCount");