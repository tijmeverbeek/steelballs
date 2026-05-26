import { Voorspelling } from "./types";

export const TOPSCORER_PUNTEN = 5;
export const GELE_KAARTEN_PUNTEN = 5;
export const TOERNOOIWINNAAR_PUNTEN = 20;
export const EERSTE_DOELPUNTENMAKER_PUNTEN = 10;

function normaliseer(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // é → e, ï → i, etc.
    .replace(/ø/g, "o")              // Ødegaard → odegaard
    .replace(/['\-.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchNaam(a: string, b: string): boolean {
  const na = normaliseer(a);
  const nb = normaliseer(b);
  if (na === nb) return true;
  // Last-name fallback: "Saka" still matches "Bukayo Saka" for anyone who typed manually
  const lastA = na.split(" ").at(-1)!;
  const lastB = nb.split(" ").at(-1)!;
  if (lastA === lastB && lastA.length >= 4) return true;
  return false;
}

// Exacte score: 3 pt, juiste uitslag: 1 pt, bonuscategorieën: vaste punten per categorie
export function berekenPunten(
  voorspellingen: Voorspelling[],
  resultaten: Record<string, { thuis: number; uit: number }>,
  deelnemer?: {
    topscorerVoorspelling?: string | null;
    geleKaartenVoorspelling?: string | null;
    toernooiwinaarVoorspelling?: string | null;
    eersteDoelpuntenmakerVoorspelling?: string | null;
  },
  poule?: {
    topscorerActief?: boolean;
    geleKaartenActief?: boolean;
    toernooiwinaarActief?: boolean;
    eersteDoelpuntenmakerActief?: boolean;
    topscorerResultaat?: string | null;
    geleKaartenResultaat?: string | null;
    toernooiwinaarResultaat?: string | null;
    eersteDoelpuntenmakerResultaat?: string | null;
  }
): number {
  let punten = 0;
  for (const vp of voorspellingen) {
    const resultaat = resultaten[vp.wedstrijdId];
    if (!resultaat || vp.thuis === null || vp.uit === null) continue;
    if (vp.thuis === resultaat.thuis && vp.uit === resultaat.uit) {
      punten += 3;
    } else {
      const uitslag = Math.sign(resultaat.thuis - resultaat.uit);
      const vpUitslag = Math.sign((vp.thuis ?? 0) - (vp.uit ?? 0));
      if (uitslag === vpUitslag) punten += 1;
    }
  }
  if (poule?.topscorerActief && poule.topscorerResultaat && deelnemer?.topscorerVoorspelling
    && matchNaam(poule.topscorerResultaat, deelnemer.topscorerVoorspelling)) {
    punten += TOPSCORER_PUNTEN;
  }
  if (poule?.geleKaartenActief && poule.geleKaartenResultaat && deelnemer?.geleKaartenVoorspelling
    && matchNaam(poule.geleKaartenResultaat, deelnemer.geleKaartenVoorspelling)) {
    punten += GELE_KAARTEN_PUNTEN;
  }
  if (poule?.toernooiwinaarActief && poule.toernooiwinaarResultaat && deelnemer?.toernooiwinaarVoorspelling
    && matchNaam(poule.toernooiwinaarResultaat, deelnemer.toernooiwinaarVoorspelling)) {
    punten += TOERNOOIWINNAAR_PUNTEN;
  }
  if (poule?.eersteDoelpuntenmakerActief && poule.eersteDoelpuntenmakerResultaat && deelnemer?.eersteDoelpuntenmakerVoorspelling
    && matchNaam(poule.eersteDoelpuntenmakerResultaat, deelnemer.eersteDoelpuntenmakerVoorspelling)) {
    punten += EERSTE_DOELPUNTENMAKER_PUNTEN;
  }
  return punten;
}

// Tiebreaker: hoe dichter bij de werkelijke minuut, hoe beter (null = oneindig ver)
export function berekenMinuutAfstand(
  voorspeldMinuut: number | null | undefined,
  werkelijkMinuut: number | null | undefined
): number {
  if (voorspeldMinuut == null || werkelijkMinuut == null) return Infinity;
  return Math.abs(voorspeldMinuut - werkelijkMinuut);
}

export function heeftCorrectEersteDoelpuntenmaker(
  deelnemer: { eersteDoelpuntenmakerVoorspelling?: string | null },
  poule: { eersteDoelpuntenmakerResultaat?: string | null }
): boolean {
  if (!poule.eersteDoelpuntenmakerResultaat || !deelnemer.eersteDoelpuntenmakerVoorspelling) return false;
  return matchNaam(poule.eersteDoelpuntenmakerResultaat, deelnemer.eersteDoelpuntenmakerVoorspelling);
}
