CREATE TABLE "ProfessionalImage" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfessionalImage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProfessionalImage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ProfessionalImage_storageKey_key" ON "ProfessionalImage"("storageKey");
CREATE INDEX "ProfessionalImage_workspaceId_idx" ON "ProfessionalImage"("workspaceId");
ALTER TABLE "Customer" ADD COLUMN "suppressGuestReplyEmail" BOOLEAN NOT NULL DEFAULT false;
