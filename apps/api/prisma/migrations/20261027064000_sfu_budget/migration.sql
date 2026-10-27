-- AlterTable
ALTER TABLE "platform_settings" ADD COLUMN     "sfuBudgetGb" INTEGER NOT NULL DEFAULT 800;

-- CreateTable
CREATE TABLE "media_usage" (
    "month" TEXT NOT NULL,
    "sfuBytes" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_usage_pkey" PRIMARY KEY ("month")
);
