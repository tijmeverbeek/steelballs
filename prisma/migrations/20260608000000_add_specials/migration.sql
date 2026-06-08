-- CreateTable
CREATE TABLE "SpecialVoorspelling" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "antwoorden" JSONB NOT NULL DEFAULT '{}',
    "bijgewerktOp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecialVoorspelling_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpecialVoorspelling_userId_key" ON "SpecialVoorspelling"("userId");

-- AddForeignKey
ALTER TABLE "SpecialVoorspelling" ADD CONSTRAINT "SpecialVoorspelling_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
