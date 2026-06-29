-- Enkelvoudig: schoten op doel + uitslag toggleable
ALTER TABLE "Poule" ADD COLUMN IF NOT EXISTS "schotenOpDoelActief" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Poule" ADD COLUMN IF NOT EXISTS "schotenOpDoelResultaat" INTEGER;
ALTER TABLE "Poule" ADD COLUMN IF NOT EXISTS "uitslagActief" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Deelnemer" ADD COLUMN IF NOT EXISTS "schotenOpDoelVoorspelling" INTEGER;
