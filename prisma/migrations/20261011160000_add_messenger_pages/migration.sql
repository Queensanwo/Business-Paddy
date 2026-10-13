-- CreateTable: MessengerPage (Phase 6c encrypted Page tokens)
CREATE TABLE "MessengerPage" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "pageName" TEXT,
    "instagramId" TEXT,
    "tokenEnc" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessengerPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MessengerPage_workspaceId_pageId_key" ON "MessengerPage"("workspaceId", "pageId");
CREATE INDEX "MessengerPage_pageId_idx" ON "MessengerPage"("pageId");

-- AddForeignKey
ALTER TABLE "MessengerPage" ADD CONSTRAINT "MessengerPage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
