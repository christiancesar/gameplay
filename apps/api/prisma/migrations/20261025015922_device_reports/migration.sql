-- CreateTable
CREATE TABLE "device_report" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "collected" JSONB NOT NULL,
    "manual" JSONB,
    "collectedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_report_userId_deviceId_key" ON "device_report"("userId", "deviceId");

-- AddForeignKey
ALTER TABLE "device_report" ADD CONSTRAINT "device_report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
