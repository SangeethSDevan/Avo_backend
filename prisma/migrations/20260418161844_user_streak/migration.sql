-- CreateTable
CREATE TABLE "Streak" (
    "userId" TEXT NOT NULL,
    "streak_count" INTEGER NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Streak_userId_key" ON "Streak"("userId");

-- AddForeignKey
ALTER TABLE "Streak" ADD CONSTRAINT "Streak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
