-- AlterTable: Phase 3 reply controls (FR19/FR21/FR22)
ALTER TABLE "Workspace" ADD COLUMN "toneGuidance" TEXT,
ADD COLUMN "autoReplyEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "autoReplyGreeting" TEXT,
ADD COLUMN "requireTraineeApproval" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable: ApprovalRequest (FR22)
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "requestedById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApprovalRequest_workspaceId_status_idx" ON "ApprovalRequest"("workspaceId", "status");
CREATE INDEX "ApprovalRequest_conversationId_idx" ON "ApprovalRequest"("conversationId");

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
