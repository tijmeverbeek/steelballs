-- CreateTable
CREATE TABLE "TournamentStat" (
    "type" TEXT NOT NULL,
    "waarde" TEXT NOT NULL,
    "bijgewerktOp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentStat_pkey" PRIMARY KEY ("type")
);
