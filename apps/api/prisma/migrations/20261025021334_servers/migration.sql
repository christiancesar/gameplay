-- CreateEnum
CREATE TYPE "ServerRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateTable
CREATE TABLE "server" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconKey" TEXT,
    "coverKey" TEXT,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "maxMembersOverride" INTEGER,
    "maxRoomsOverride" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "server_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_member" (
    "serverId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ServerRole" NOT NULL,
    "inviteId" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "server_member_pkey" PRIMARY KEY ("serverId","userId")
);

-- CreateTable
CREATE TABLE "room" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "server_ownerId_idx" ON "server"("ownerId");

-- CreateIndex
CREATE INDEX "server_member_userId_idx" ON "server_member"("userId");

-- CreateIndex
CREATE INDEX "room_serverId_position_idx" ON "room"("serverId", "position");

-- AddForeignKey
ALTER TABLE "server" ADD CONSTRAINT "server_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_member" ADD CONSTRAINT "server_member_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_member" ADD CONSTRAINT "server_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
