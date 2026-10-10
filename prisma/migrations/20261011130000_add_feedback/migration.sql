-- AlterTable: Phase 5 customer feedback (toggle + per-conversation rating)
ALTER TABLE "Workspace" ADD COLUMN "feedbackEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Conversation" ADD COLUMN "rating" TEXT,
ADD COLUMN "feedbackComment" TEXT,
ADD COLUMN "feedbackAt" TIMESTAMP(3);
