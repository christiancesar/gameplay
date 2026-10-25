-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "maxServersPerUser" INTEGER NOT NULL DEFAULT 1,
    "maxMembersPerServer" INTEGER NOT NULL DEFAULT 10,
    "maxRoomsPerServer" INTEGER NOT NULL DEFAULT 2,
    "minChromiumVersion" INTEGER NOT NULL DEFAULT 130,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- The single settings row, with the defaults.
INSERT INTO "platform_settings" ("id", "updatedAt") VALUES ('global', CURRENT_TIMESTAMP);
