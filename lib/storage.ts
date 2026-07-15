import { Voorspelling } from "./types";

export const TOPSCORER_PUNTEN = 5;
export const GELE_KAARTEN_PUNTEN = 5;
export const TOERNOOIWINNAAR_PUNTEN = 20;
export const EERSTE_DOELPUNTENMAKER_PUNTEN = 10;

// CL Finale + Enkelvoudig: zelfde puntentelling
export const CL_SCORE_PUNTEN = 10;        // exact uitslag
export const CL_WINNAAR_PUNTEN = 5;       // correct winnaar (niet exact)
export const CL_DOELPUNTENMAKER_PUNTEN = 3; // eerste doelpuntenmaker
// minuut = tiebreaker (geen punten)

// Enkelvoudig poule extra — uitslag, corners en schoten op doel zijn gelijkwaardig
export const ENKELVOUDIG_CORNERS_PUNTEN = 3;
export const ENKELVOUDIG_SCHOTEN_PUNTEN = 3;
export const ENKELVOUDIG_EERSTE_KAART_PUNTEN = 3;
export const ENKELVOUDIG_EERSTE_KAART_MINUUT_PUNTEN = 3;

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
    cornersVoorspelling?: number | null;
    schotenOpDoelVoorspelling?: number | null;
    eersteKaartSpelerVoorspelling?: string | null;
    eersteKaartMinuutVoorspelling?: number | null;
  },
  poule?: {
    soort?: string;
    topscorerActief?: boolean;
    geleKaartenActief?: boolean;
    toernooiwinaarActief?: boolean;
    eersteDoelpuntenmakerActief?: boolean;
    eersteDoelpuntenminuutActief?: boolean;
    cornersActief?: boolean;
    schotenOpDoelActief?: boolean;
    eersteKaartActief?: boolean;
    eersteKaartSpelerResultaat?: string | null;
    eersteKaartMinuutActief?: boolean;
    eersteKaartMinuutResultaat?: number | null;
    uitslagActief?: boolean;
    topscorerResultaat?: string | null;
    geleKaartenResultaat?: string | null;
    toernooiwinaarResultaat?: string | null;
    eersteDoelpuntenmakerResultaat?: string | null;
    eersteDoelpuntenminuutResultaat?: number | null;
    cornersResultaat?: number | null;
    schotenOpDoelResultaat?: number | null;
  }
): number {
  const isClFinale = poule?.soort === "cl_finale";
  const isOefenwedstrijd = poule?.soort === "oefenwedstrijd";
  const isEnkelvoudig = poule?.soort === "enkelvoudig";
  let punten = 0;

  // Voor enkelvoudig is uitslag standaard actief, maar kan worden uitgeschakeld
  const uitslagTelt = !isEnkelvoudig || (poule?.uitslagActief !== false);

  for (const vp of voorspellingen) {
    const resultaat = resultaten[vp.wedstrijdId];
    if (!resultaat || vp.thuis === null) continue;
    if (isOefenwedstrijd) {
      // Totaal corners: exact = 3 pt
      if (vp.thuis === resultaat.thuis) punten += 3;
    } else if (isEnkelvoudig && !uitslagTelt) {
      // Uitslag uitgeschakeld voor deze enkelvoudig poule
    } else {
      if (vp.uit === null) continue;
      if (vp.thuis === resultaat.thuis && vp.uit === resultaat.uit) {
        punten += (isClFinale || isEnkelvoudig) ? CL_SCORE_PUNTEN : 3;
      } else {
        const uitslag = Math.sign(resultaat.thuis - resultaat.uit);
        const vpUitslag = Math.sign((vp.thuis ?? 0) - (vp.uit ?? 0));
        if (uitslag === vpUitslag) punten += (isClFinale || isEnkelvoudig) ? CL_WINNAAR_PUNTEN : 1;
      }
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
    punten += (isClFinale || isEnkelvoudig) ? CL_DOELPUNTENMAKER_PUNTEN : EERSTE_DOELPUNTENMAKER_PUNTEN;
  }
  if (isEnkelvoudig && poule?.cornersActief && poule.cornersResultaat != null
    && deelnemer?.cornersVoorspelling != null
    && deelnemer.cornersVoorspelling === poule.cornersResultaat) {
    punten += ENKELVOUDIG_CORNERS_PUNTEN;
  }
  if (isEnkelvoudig && poule?.schotenOpDoelActief && poule.schotenOpDoelResultaat != null
    && deelnemer?.schotenOpDoelVoorspelling != null
    && deelnemer.schotenOpDoelVoorspelling === poule.schotenOpDoelResultaat) {
    punten += ENKELVOUDIG_SCHOTEN_PUNTEN;
  }
  if (isEnkelvoudig && poule?.eersteKaartActief && poule.eersteKaartSpelerResultaat
    && deelnemer?.eersteKaartSpelerVoorspelling
    && matchNaam(poule.eersteKaartSpelerResultaat, deelnemer.eersteKaartSpelerVoorspelling)) {
    punten += ENKELVOUDIG_EERSTE_KAART_PUNTEN;
  }
  if (isEnkelvoudig && poule?.eersteKaartMinuutActief && poule.eersteKaartMinuutResultaat != null
    && deelnemer?.eersteKaartMinuutVoorspelling != null
    && deelnemer.eersteKaartMinuutVoorspelling === poule.eersteKaartMinuutResultaat) {
    punten += ENKELVOUDIG_EERSTE_KAART_MINUUT_PUNTEN;
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
