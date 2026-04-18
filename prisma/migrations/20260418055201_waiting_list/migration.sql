-- CreateTable
CREATE TABLE "WaitingList" (
    "emailId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "WaitingList_emailId_key" ON "WaitingList"("emailId");
