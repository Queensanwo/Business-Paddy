-- AlterTable: Phase 4c business website front (owner-maintained public fields)
ALTER TABLE "Workspace" ADD COLUMN "siteEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "siteDescription" TEXT,
ADD COLUMN "siteProducts" TEXT,
ADD COLUMN "siteHours" TEXT,
ADD COLUMN "siteContact" TEXT;
