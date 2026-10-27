-- AlterTable
ALTER TABLE "platform_settings" ADD COLUMN     "meshEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sfuEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "turnEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "server" ADD COLUMN     "meshEnabled" BOOLEAN,
ADD COLUMN     "sfuEnabled" BOOLEAN,
ADD COLUMN     "turnEnabled" BOOLEAN;
