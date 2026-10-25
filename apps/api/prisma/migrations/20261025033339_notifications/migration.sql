-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('JOIN_REQUEST_SENT', 'JOIN_APPROVED', 'KICKED', 'SERVER_DELETED', 'PROMOTED', 'DEMOTED', 'INVITE_EXPIRED');

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dismissedAt" TIMESTAMP(3),

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_userId_dismissedAt_createdAt_idx" ON "notification"("userId", "dismissedAt", "createdAt");

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
