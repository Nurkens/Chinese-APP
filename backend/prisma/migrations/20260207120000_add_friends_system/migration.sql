-- AlterTable: Add tag column (nullable first)
ALTER TABLE "users" ADD COLUMN "tag" TEXT;

-- Backfill existing users with generated tags
UPDATE "users" SET "tag" = "username" || '#' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0') WHERE "tag" IS NULL;

-- Make tag NOT NULL and add UNIQUE constraint
ALTER TABLE "users" ALTER COLUMN "tag" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_tag_key" ON "users"("tag");

-- CreateTable
CREATE TABLE "friendships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "friendships_userId_friendId_key" ON "friendships"("userId", "friendId");

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
