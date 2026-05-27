-- CreateTable
CREATE TABLE "daily_stories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "lines" JSONB NOT NULL,
    "wordsUsed" JSONB NOT NULL,
    "hskLevel" INTEGER,
    "model" TEXT NOT NULL,
    "regenCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_stories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_stories_userId_date_key" ON "daily_stories"("userId", "date");

-- CreateIndex
CREATE INDEX "daily_stories_userId_date_idx" ON "daily_stories"("userId", "date");

-- AddForeignKey
ALTER TABLE "daily_stories" ADD CONSTRAINT "daily_stories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
