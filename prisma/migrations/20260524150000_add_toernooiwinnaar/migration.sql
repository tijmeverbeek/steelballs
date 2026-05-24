-- AlterTable
ALTER TABLE "Poule" ADD COLUMN "toernooiwinaarActief" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Poule" ADD COLUMN "toernooiwinaarResultaat" TEXT;

-- AlterTable
ALTER TABLE "Deelnemer" ADD COLUMN "toernooiwinaarVoorspelling" TEXT;
