-- AlterTable: track reminder creator for visibility (assignee + creator + managers)
ALTER TABLE "Reminder" ADD COLUMN "createdById" TEXT;
