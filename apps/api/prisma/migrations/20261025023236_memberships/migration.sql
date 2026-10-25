-- CreateEnum
CREATE TYPE "JoinStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- CreateTable
CREATE TABLE "server_invite" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "usedById" TEXT,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "server_invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "join_request" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "status" "JoinStatus" NOT NULL,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "join_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "server_invite_code_key" ON "server_invite"("code");

-- CreateIndex
CREATE INDEX "server_invite_serverId_createdAt_idx" ON "server_invite"("serverId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "join_request_inviteId_key" ON "join_request"("inviteId");

-- CreateIndex
CREATE INDEX "join_request_serverId_status_idx" ON "join_request"("serverId", "status");

-- CreateIndex
CREATE INDEX "join_request_userId_serverId_idx" ON "join_request"("userId", "serverId");

-- AddForeignKey
ALTER TABLE "server_invite" ADD CONSTRAINT "server_invite_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_invite" ADD CONSTRAINT "server_invite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_invite" ADD CONSTRAINT "server_invite_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_request" ADD CONSTRAINT "join_request_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_request" ADD CONSTRAINT "join_request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_request" ADD CONSTRAINT "join_request_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "server_invite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_request" ADD CONSTRAINT "join_request_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_member" ADD CONSTRAINT "server_member_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "server_invite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
