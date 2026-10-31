-- CreateEnum
CREATE TYPE "PublicRoadmapStatus" AS ENUM ('NOW', 'NEXT', 'EXPLORING', 'DONE');

-- CreateEnum
CREATE TYPE "PublicContentVisibility" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FeatureRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "roadmap_item" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "PublicRoadmapStatus" NOT NULL DEFAULT 'EXPLORING',
    "position" INTEGER NOT NULL DEFAULT 0,
    "visibility" "PublicContentVisibility" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    CONSTRAINT "roadmap_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "changelog_entry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL,
    "visibility" "PublicContentVisibility" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    CONSTRAINT "changelog_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_request" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "FeatureRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,
    "roadmapItemId" TEXT,
    CONSTRAINT "feature_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_vote" (
    "userId" TEXT NOT NULL,
    "roadmapItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feature_vote_pkey" PRIMARY KEY ("userId", "roadmapItemId")
);

-- CreateIndex
CREATE UNIQUE INDEX "roadmap_item_slug_key" ON "roadmap_item"("slug");
CREATE INDEX "roadmap_item_visibility_status_position_idx" ON "roadmap_item"("visibility", "status", "position");
CREATE UNIQUE INDEX "changelog_entry_slug_key" ON "changelog_entry"("slug");
CREATE INDEX "changelog_entry_visibility_publishedAt_idx" ON "changelog_entry"("visibility", "publishedAt");
CREATE INDEX "feature_request_authorId_createdAt_idx" ON "feature_request"("authorId", "createdAt");
CREATE INDEX "feature_request_status_createdAt_idx" ON "feature_request"("status", "createdAt");
CREATE INDEX "feature_vote_roadmapItemId_idx" ON "feature_vote"("roadmapItemId");

-- AddForeignKey
ALTER TABLE "roadmap_item" ADD CONSTRAINT "roadmap_item_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "roadmap_item" ADD CONSTRAINT "roadmap_item_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "changelog_entry" ADD CONSTRAINT "changelog_entry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "changelog_entry" ADD CONSTRAINT "changelog_entry_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "feature_request" ADD CONSTRAINT "feature_request_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "feature_request" ADD CONSTRAINT "feature_request_roadmapItemId_fkey" FOREIGN KEY ("roadmapItemId") REFERENCES "roadmap_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "feature_vote" ADD CONSTRAINT "feature_vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "feature_vote" ADD CONSTRAINT "feature_vote_roadmapItemId_fkey" FOREIGN KEY ("roadmapItemId") REFERENCES "roadmap_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
