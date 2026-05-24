-- AlterTable
ALTER TABLE "Poule" ADD COLUMN "geleKaartenActief" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Poule" ADD COLUMN "geleKaartenResultaat" TEXT;
ALTER TABLE "Poule" ADD COLUMN "organisatorId" TEXT;
ALTER TABLE "Poule" ADD COLUMN "topscorerActief" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Poule" ADD COLUMN "topscorerResultaat" TEXT;

-- AlterTable
ALTER TABLE "Deelnemer" ADD COLUMN "geleKaartenVoorspelling" TEXT;
ALTER TABLE "Deelnemer" ADD COLUMN "topscorerVoorspelling" TEXT;
