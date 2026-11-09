CREATE TYPE "WorkspaceKind" AS ENUM ('BUSINESS', 'PROFESSIONAL');
ALTER TABLE "Workspace"
  ADD COLUMN "siteProfessionalProfile" JSONB,
  ADD COLUMN "workspaceKind" "WorkspaceKind" NOT NULL DEFAULT 'BUSINESS';
