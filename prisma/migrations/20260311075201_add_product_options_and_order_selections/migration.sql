-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "customSelections" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "selectedColor" TEXT,
ADD COLUMN     "selectedSize" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "colors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "customFields" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "sizes" TEXT[] DEFAULT ARRAY[]::TEXT[];
