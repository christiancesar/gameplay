-- CreateTable
CREATE TABLE "registration_invite" (
    "id" TEXT NOT NULL,
    "keyHmac" TEXT NOT NULL,
    "keySuffix" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "usedById" TEXT,

    CONSTRAINT "registration_invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registration_invite_keyHmac_key" ON "registration_invite"("keyHmac");

-- CreateIndex
CREATE UNIQUE INDEX "registration_invite_usedById_key" ON "registration_invite"("usedById");

-- CreateIndex
CREATE INDEX "registration_invite_createdAt_idx" ON "registration_invite"("createdAt");

-- AddForeignKey
ALTER TABLE "registration_invite" ADD CONSTRAINT "registration_invite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_invite" ADD CONSTRAINT "registration_invite_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
