import { Voorspelling } from "./types";

export const TOPSCORER_PUNTEN = 5;
export const GELE_KAARTEN_PUNTEN = 5;

// Exacte score: 3 pt, juiste uitslag: 1 pt, topscorer/geleKaarten correct: 5 pt
export function berekenPunten(
  voorspellingen: Voorspelling[],
  resultaten: Record<string, { thuis: number; uit: number }>,
  deelnemer?: { topscorerVoorspelling?: string | null; geleKaartenVoorspelling?: string | null },
  poule?: {
    topscorerActief?: boolean;
    geleKaartenActief?: boolean;
    topscorerResultaat?: string | null;
    geleKaartenResultaat?: string | null;
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
  if (
    poule?.topscorerActief &&
    poule.topscorerResultaat &&
    deelnemer?.topscorerVoorspelling &&
    poule.topscorerResultaat.trim().toLowerCase() === deelnemer.topscorerVoorspelling.trim().toLowerCase()
  ) {
    punten += TOPSCORER_PUNTEN;
  }
  if (
    poule?.geleKaartenActief &&
    poule.geleKaartenResultaat &&
    deelnemer?.geleKaartenVoorspelling &&
    poule.geleKaartenResultaat.trim().toLowerCase() === deelnemer.geleKaartenVoorspelling.trim().toLowerCase()
  ) {
    punten += GELE_KAARTEN_PUNTEN;
  }
  return punten;
}
