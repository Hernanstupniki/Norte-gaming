-- CreateTable SalesRecord
CREATE TABLE "SalesRecord" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesRecord_productId_idx" ON "SalesRecord"("productId");

-- CreateIndex
CREATE INDEX "SalesRecord_createdAt_idx" ON "SalesRecord"("createdAt");

-- AddForeignKey
ALTER TABLE "SalesRecord" ADD CONSTRAINT "SalesRecord_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
