-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('DELIVERY', 'PICKUP');

-- CreateEnum
CREATE TYPE "LogisticsProvider" AS ENUM ('INTERNAL', 'SPEEDAF');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deliveryMethod" "DeliveryMethod" NOT NULL DEFAULT 'DELIVERY',
ADD COLUMN     "logisticsMetadata" JSONB,
ADD COLUMN     "logisticsProvider" "LogisticsProvider" NOT NULL DEFAULT 'INTERNAL',
ADD COLUMN     "logisticsReference" TEXT,
ADD COLUMN     "pickupLocationId" TEXT;

-- CreateTable
CREATE TABLE "pickup_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "landmark" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "pickupInstructions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "logisticsProvider" "LogisticsProvider" NOT NULL DEFAULT 'INTERNAL',
    "externalReference" TEXT,
    "logisticsMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pickup_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pickup_locations_slug_key" ON "pickup_locations"("slug");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "pickup_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
