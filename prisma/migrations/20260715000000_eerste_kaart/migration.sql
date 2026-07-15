ALTER TABLE "Poule" ADD COLUMN IF NOT EXISTS "eersteKaartActief" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Poule" ADD COLUMN IF NOT EXISTS "eersteKaartSpelerResultaat" TEXT;
ALTER TABLE "Poule" ADD COLUMN IF NOT EXISTS "eersteKaartMinuutActief" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Poule" ADD COLUMN IF NOT EXISTS "eersteKaartMinuutResultaat" INTEGER;
ALTER TABLE "Deelnemer" ADD COLUMN IF NOT EXISTS "eersteKaartSpelerVoorspelling" TEXT;
ALTER TABLE "Deelnemer" ADD COLUMN IF NOT EXISTS "eersteKaartMinuutVoorspelling" INTEGER;
