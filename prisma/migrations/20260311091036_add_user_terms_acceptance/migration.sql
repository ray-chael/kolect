-- AlterTable
ALTER TABLE "users" ADD COLUMN     "hasAcceptedTerms" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3);
