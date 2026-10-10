-- CreateTable
CREATE TABLE "Macro" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "assignUserId" TEXT,
    "status" "ConvStatus",
    "escalateToId" TEXT,
    "escalateReason" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Macro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Macro_workspaceId_idx" ON "Macro"("workspaceId");

-- AddForeignKey
ALTER TABLE "Macro" ADD CONSTRAINT "Macro_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
