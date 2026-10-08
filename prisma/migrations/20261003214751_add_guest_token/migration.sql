-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "guestToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_guestToken_key" ON "Conversation"("guestToken");
