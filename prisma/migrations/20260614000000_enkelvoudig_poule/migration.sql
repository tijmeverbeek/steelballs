-- Enkelvoudig poule type: single WK match with corners + player predictions
ALTER TABLE "Poule" ADD COLUMN "cornersActief" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Poule" ADD COLUMN "cornersResultaat" INTEGER;
ALTER TABLE "Poule" ADD COLUMN "wkWedstrijdId" TEXT;

ALTER TABLE "Deelnemer" ADD COLUMN "cornersVoorspelling" INTEGER;
