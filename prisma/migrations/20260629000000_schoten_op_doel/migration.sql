-- Enkelvoudig: schoten op doel + uitslag toggleable
ALTER TABLE "Poule" ADD COLUMN "schotenOpDoelActief" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Poule" ADD COLUMN "schotenOpDoelResultaat" INTEGER;
ALTER TABLE "Poule" ADD COLUMN "uitslagActief" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Deelnemer" ADD COLUMN "schotenOpDoelVoorspelling" INTEGER;
