-- CreateTable
CREATE TABLE "flash_sales" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Flash Sale',
    "salePrice" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flash_sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flash_sales_productId_idx" ON "flash_sales"("productId");

-- CreateIndex
CREATE INDEX "flash_sales_isActive_endsAt_idx" ON "flash_sales"("isActive", "endsAt");

-- AddForeignKey
ALTER TABLE "flash_sales" ADD CONSTRAINT "flash_sales_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
