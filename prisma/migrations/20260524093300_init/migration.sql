-- CreateTable
CREATE TABLE "Poule" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "aangemaaktOp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Poule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deelnemer" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "pouleId" TEXT NOT NULL,

    CONSTRAINT "Deelnemer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voorspelling" (
    "id" TEXT NOT NULL,
    "wedstrijdId" TEXT NOT NULL,
    "thuis" INTEGER,
    "uit" INTEGER,
    "deelnemerId" TEXT NOT NULL,

    CONSTRAINT "Voorspelling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resultaat" (
    "wedstrijdId" TEXT NOT NULL,
    "thuis" INTEGER NOT NULL,
    "uit" INTEGER NOT NULL,

    CONSTRAINT "Resultaat_pkey" PRIMARY KEY ("wedstrijdId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Poule_code_key" ON "Poule"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Voorspelling_deelnemerId_wedstrijdId_key" ON "Voorspelling"("deelnemerId", "wedstrijdId");

-- AddForeignKey
ALTER TABLE "Deelnemer" ADD CONSTRAINT "Deelnemer_pouleId_fkey" FOREIGN KEY ("pouleId") REFERENCES "Poule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voorspelling" ADD CONSTRAINT "Voorspelling_deelnemerId_fkey" FOREIGN KEY ("deelnemerId") REFERENCES "Deelnemer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
