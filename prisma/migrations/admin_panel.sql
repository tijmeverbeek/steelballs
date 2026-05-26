-- Admin panel migration
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "FeatureFlag" (
  "naam" TEXT NOT NULL,
  "aanGezet" BOOLEAN NOT NULL DEFAULT false,
  "beschrijving" TEXT NOT NULL DEFAULT '',
  "bijgewerktOp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("naam")
);

-- Seed initial feature flags
INSERT INTO "FeatureFlag" ("naam", "aanGezet", "beschrijving", "bijgewerktOp")
VALUES
  ('live_scores', false, 'Live score updates via externe API', NOW()),
  ('api_football', false, 'API-Football integratie ingeschakeld', NOW())
ON CONFLICT ("naam") DO NOTHING;
