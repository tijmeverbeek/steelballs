CREATE TABLE "LmsWedstrijd" (
    "id" TEXT NOT NULL,
    "rondeNr" INTEGER NOT NULL,
    "thuisCode" TEXT NOT NULL,
    "thuisNaam" TEXT NOT NULL,
    "thuisVlag" TEXT NOT NULL,
    "uitCode" TEXT NOT NULL,
    "uitNaam" TEXT NOT NULL,
    "uitVlag" TEXT NOT NULL,
    "datum" TEXT,
    "tijd" TEXT,
    CONSTRAINT "LmsWedstrijd_pkey" PRIMARY KEY ("id")
);
