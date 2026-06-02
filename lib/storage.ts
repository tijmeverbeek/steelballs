import { Voorspelling } from "./types";

export const TOPSCORER_PUNTEN = 5;
export const GELE_KAARTEN_PUNTEN = 5;
export const TOERNOOIWINNAAR_PUNTEN = 20;
export const EERSTE_DOELPUNTENMAKER_PUNTEN = 10;

// CL Finale heeft eigen puntentelling (maar 1 wedstrijd)
export const CL_SCORE_PUNTEN = 10;
export const CL_DOELPUNTENMAKER_PUNTEN = 5;
export const CL_MINUUT_PUNTEN = 2;

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

export function berekenPunten(
  voorspellingen: Voorspelling[],
  resultaten: Record<string, { thuis: number; uit: number }>,
  deelnemer?: {
    topscorerVoorspelling?: string | null;
    geleKaartenVoorspelling?: string | null;
    toernooiwinaarVoorspelling?: string | null;
    eersteDoelpuntenmakerVoorspelling?: string | null;
    eersteDoelpuntenminuutVoorspelling?: number | null;
  },
  poule?: {
    soort?: string;
    topscorerActief?: boolean;
    geleKaartenActief?: boolean;
    toernooiwinaarActief?: boolean;
    eersteDoelpuntenmakerActief?: boolean;
    eersteDoelpuntenminuutActief?: boolean;
    topscorerResultaat?: string | null;
    geleKaartenResultaat?: string | null;
    toernooiwinaarResultaat?: string | null;
    eersteDoelpuntenmakerResultaat?: string | null;
    eersteDoelpuntenminuutResultaat?: number | null;
  }
): number {
  const isSingleMatch = poule?.soort === "cl_finale" || poule?.soort === "nl_oefen";
  let punten = 0;

  for (const vp of voorspellingen) {
    const resultaat = resultaten[vp.wedstrijdId];
    if (!resultaat || vp.thuis === null || vp.uit === null) continue;
    if (vp.thuis === resultaat.thuis && vp.uit === resultaat.uit) {
      punten += isSingleMatch ? CL_SCORE_PUNTEN : 3;
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
    punten += isSingleMatch ? CL_DOELPUNTENMAKER_PUNTEN : EERSTE_DOELPUNTENMAKER_PUNTEN;
  }
  if (isSingleMatch && poule?.eersteDoelpuntenminuutActief && poule.eersteDoelpuntenminuutResultaat != null
    && deelnemer?.eersteDoelpuntenminuutVoorspelling != null
    && deelnemer.eersteDoelpuntenminuutVoorspelling === poule.eersteDoelpuntenminuutResultaat) {
    punten += CL_MINUUT_PUNTEN;
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
