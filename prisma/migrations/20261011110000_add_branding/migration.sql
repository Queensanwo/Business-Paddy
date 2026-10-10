-- AlterTable: Phase 4b business branding (theme preset, custom accent, logo)
ALTER TABLE "Workspace" ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'NAVY',
ADD COLUMN "accentColor" TEXT,
ADD COLUMN "logoStorageKey" TEXT,
ADD COLUMN "logoMime" TEXT;
