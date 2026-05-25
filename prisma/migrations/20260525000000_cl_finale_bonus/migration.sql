ALTER TABLE "Poule"
  ADD COLUMN "eersteDoelpuntenmakerActief"     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "eersteDoelpuntenminuutActief"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "eersteDoelpuntenmakerResultaat"  TEXT,
  ADD COLUMN "eersteDoelpuntenminuutResultaat" INTEGER;

ALTER TABLE "Deelnemer"
  ADD COLUMN "eersteDoelpuntenmakerVoorspelling"   TEXT,
  ADD COLUMN "eersteDoelpuntenminuutVoorspelling"  INTEGER;
