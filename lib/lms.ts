import { Wedstrijd } from "./types";
import { LMS_RONDE_MATCHES, getWedstrijdenByIds } from "./matches";

export interface LmsRonde {
  nr: number;
  naam: string;
  vanDatum: string;
  totDatum: string;
  deadline: string; // UTC ISO — Dutch summer time (CEST) = UTC+2
}

// All deadlines are Dutch kickoff time of the first match in the round (CEST = UTC+2 → subtract 2h for UTC)
// R1: 11 jun 21:00 CEST → 19:00 UTC  (first match: MEX-ZAF)
// R2: 18 jun 18:00 CEST → 16:00 UTC  (first match: CZE-ZAF)
// R3: 24 jun 21:00 CEST → 19:00 UTC  (first match: SUI-CAN & BIH-QAT)
// R4: 28 jun 21:00 CEST → 19:00 UTC  (first match: #73 Num.2A-Num.2B)
// R5: 4 jul 19:00 CEST  → 17:00 UTC  (first match: #90)
// R6: 9 jul 22:00 CEST  → 20:00 UTC  (first match: #97)
// R7: 14 jul 21:00 CEST → 19:00 UTC  (first match: #101)
// R8: 19 jul 21:00 CEST → 19:00 UTC  (finale #104)
export const LMS_RONDES: LmsRonde[] = [
  { nr: 1, naam: "Groepsfase – Ronde 1", vanDatum: "2026-06-11", totDatum: "2026-06-18", deadline: "2026-06-11T19:00:00Z" },
  { nr: 2, naam: "Groepsfase – Ronde 2", vanDatum: "2026-06-18", totDatum: "2026-06-24", deadline: "2026-06-18T16:00:00Z" },
  { nr: 3, naam: "Groepsfase – Ronde 3", vanDatum: "2026-06-24", totDatum: "2026-06-28", deadline: "2026-06-24T19:00:00Z" },
  { nr: 4, naam: "Ronde van 32",         vanDatum: "2026-06-28", totDatum: "2026-07-04", deadline: "2026-06-28T19:00:00Z" },
  { nr: 5, naam: "Achtste finales",      vanDatum: "2026-07-04", totDatum: "2026-07-07", deadline: "2026-07-04T17:00:00Z" },
  { nr: 6, naam: "Kwartfinales",         vanDatum: "2026-07-09", totDatum: "2026-07-12", deadline: "2026-07-09T20:00:00Z" },
  { nr: 7, naam: "Halve finales",        vanDatum: "2026-07-14", totDatum: "2026-07-15", deadline: "2026-07-14T19:00:00Z" },
  { nr: 8, naam: "Finale",               vanDatum: "2026-07-19", totDatum: "2026-07-19", deadline: "2026-07-19T19:00:00Z" },
];

// Group stage matches looked up via explicit ID mapping; knockout rounds come from LmsWedstrijd DB table
export function getWedstrijdenVoorRonde(rondeNr: number): Wedstrijd[] {
  const ids = LMS_RONDE_MATCHES[rondeNr];
  if (!ids) return [];
  return getWedstrijdenByIds(ids);
}

export function getDeadlineVoorRonde(rondeNr: number): Date | null {
  const ronde = LMS_RONDES.find((r) => r.nr === rondeNr);
  if (!ronde) return null;
  return new Date(ronde.deadline);
}

export function isRondeGesloten(rondeNr: number): boolean {
  const deadline = getDeadlineVoorRonde(rondeNr);
  if (!deadline) return false;
  return new Date() >= deadline;
}

export function getHuidigeRonde(): LmsRonde | null {
  const nu = new Date();
  const upcoming = LMS_RONDES.find((r) => new Date(r.deadline) >= nu);
  return upcoming ?? LMS_RONDES[LMS_RONDES.length - 1];
}
