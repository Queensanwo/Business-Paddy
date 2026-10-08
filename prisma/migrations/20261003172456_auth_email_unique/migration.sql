-- DropIndex
DROP INDEX "User_workspaceId_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_workspaceId_email_idx" ON "User"("workspaceId", "email");
