import { Voorspelling } from "./types";

export const TOPSCORER_PUNTEN = 5;
export const GELE_KAARTEN_PUNTEN = 5;
export const TOERNOOIWINNAAR_PUNTEN = 20;

function matchNaam(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

// Exacte score: 3 pt, juiste uitslag: 1 pt, bonuscategorieën: vaste punten per categorie
export function berekenPunten(
  voorspellingen: Voorspelling[],
  resultaten: Record<string, { thuis: number; uit: number }>,
  deelnemer?: {
    topscorerVoorspelling?: string | null;
    geleKaartenVoorspelling?: string | null;
    toernooiwinaarVoorspelling?: string | null;
  },
  poule?: {
    topscorerActief?: boolean;
    geleKaartenActief?: boolean;
    toernooiwinaarActief?: boolean;
    topscorerResultaat?: string | null;
    geleKaartenResultaat?: string | null;
    toernooiwinaarResultaat?: string | null;
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
  return punten;
}
